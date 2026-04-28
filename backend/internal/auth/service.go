package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrEmailTaken         = errors.New("email_taken")
	ErrInvalidCredentials = errors.New("invalid_credentials")
	ErrEmailNotVerified   = errors.New("email_not_verified")
	ErrAccountSuspended   = errors.New("account_suspended")
	ErrAccountBanned      = errors.New("account_banned")
	ErrInvalidToken       = errors.New("invalid_or_expired_token")
	ErrSessionRevoked     = errors.New("session_revoked")
)

type Service struct {
	repo          *Repository
	redis         *redis.Client
	email         *EmailService
	jwtSecret     string
	refreshSecret string
}

func NewService(repo *Repository, rdb *redis.Client, email *EmailService, jwtSecret, refreshSecret string) *Service {
	return &Service{
		repo:          repo,
		redis:         rdb,
		email:         email,
		jwtSecret:     jwtSecret,
		refreshSecret: refreshSecret,
	}
}

type RegisterRequest struct {
	FullName string
	Email    string
	Password string
	Role     string
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) error {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	_, err := s.repo.GetUserByEmail(ctx, email)
	if err == nil {
		return ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return err
	}
	hashStr := string(hash)

	svStatus := "none"
	if req.Role == "supervisor" {
		svStatus = "pending_verification"
	}

	user := &User{
		Email:            email,
		PasswordHash:     &hashStr,
		FullName:         strings.TrimSpace(req.FullName),
		Role:             req.Role,
		SupervisorStatus: svStatus,
		EmailVerified:         false,
		NotificationsEnabled:  true,
		NotificationsPriority: "medium",
	}

	if err := s.repo.CreateUser(ctx, user); err != nil {
		return err
	}

	rawToken := generateSecureToken(32)
	tokenHash := hashToken(rawToken)

	authToken := &AuthToken{
		UserID:    user.ID,
		TokenHash: tokenHash,
		Type:      "email_verification",
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	if err := s.repo.CreateAuthToken(ctx, authToken); err != nil {
		return err
	}

	if err := s.redis.Set(ctx, fmt.Sprintf("zosterix:unverified_delete:%s", user.ID), "", 7*24*time.Hour).Err(); err != nil {
		log.Warn().Err(err).Msg("failed to set unverified_delete in redis")
	}
	_ = s.email.SendVerificationEmail(user.Email, user.FullName, rawToken)

	return nil
}

func (s *Service) VerifyEmail(ctx context.Context, rawToken string) error {
	tokenHash := hashToken(rawToken)
	token, err := s.repo.GetAuthTokenByHash(ctx, tokenHash, "email_verification")
	if err != nil {
		return ErrInvalidToken
	}

	if err := s.repo.UpdateEmailVerified(ctx, token.UserID, true); err != nil {
		return err
	}

	if err := s.repo.MarkTokenUsed(ctx, token.ID); err != nil {
		return err
	}

	if err := s.redis.Del(ctx, fmt.Sprintf("zosterix:unverified_delete:%s", token.UserID)).Err(); err != nil {
		log.Warn().Err(err).Msg("failed to delete unverified_delete from redis")
	}
	return nil
}

func (s *Service) Login(ctx context.Context, email, password string) (string, string, *User, bool, error) {
	user, err := s.repo.GetUserByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		time.Sleep(200 * time.Millisecond)
		return "", "", nil, false, ErrInvalidCredentials
	}

	if user.IsBanned {
		return "", "", nil, false, ErrAccountBanned
	}
	if user.IsSuspended {
		return "", "", nil, false, ErrAccountSuspended
	}
	if !user.EmailVerified {
		return "", "", nil, false, ErrEmailNotVerified
	}

	if user.PasswordHash == nil || bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(password)) != nil {
		return "", "", nil, false, ErrInvalidCredentials
	}

	accessToken, err := GenerateAccessToken(user.ID.String(), user.Email, user.Role, user.SupervisorStatus, s.jwtSecret)
	if err != nil {
		return "", "", nil, false, err
	}

	refreshToken, jti, err := GenerateRefreshToken(user.ID.String(), s.refreshSecret)
	if err != nil {
		return "", "", nil, false, err
	}

	// Track refresh tokens for revocation
	if err := s.redis.SAdd(ctx, fmt.Sprintf("zosterix:user_refresh_jtis:%s", user.ID), jti).Err(); err != nil {
		log.Warn().Err(err).Msg("failed to track refresh token in redis")
	} else {
		s.redis.Expire(ctx, fmt.Sprintf("zosterix:user_refresh_jtis:%s", user.ID), 30*24*time.Hour)
	}

	profileComplete, _ := s.repo.IsProfileComplete(ctx, user.ID)

	return accessToken, refreshToken, user, profileComplete, nil
}

func (s *Service) RefreshToken(ctx context.Context, oldRefreshToken string) (string, string, *User, bool, error) {
	claims, err := ValidateRefreshToken(oldRefreshToken, s.refreshSecret)
	if err != nil {
		return "", "", nil, false, err
	}

	// Check blocklist
	blocked, err := s.redis.Exists(ctx, fmt.Sprintf("zosterix:blocklist:refresh:%s", claims.JTI)).Result()
	if err != nil {
		log.Warn().Err(err).Msg("failed to check blocklist in redis")
	} else if blocked > 0 {
		return "", "", nil, false, ErrSessionRevoked
	}

	userID, _ := uuid.Parse(claims.UserID)
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil || user.IsBanned || user.IsSuspended {
		return "", "", nil, false, ErrInvalidCredentials
	}

	// Issue new tokens
	accessToken, err := GenerateAccessToken(user.ID.String(), user.Email, user.Role, user.SupervisorStatus, s.jwtSecret)
	if err != nil {
		return "", "", nil, false, err
	}

	newRefreshToken, newJTI, err := GenerateRefreshToken(user.ID.String(), s.refreshSecret)
	if err != nil {
		return "", "", nil, false, err
	}

	// Blocklist old token
	remaining := time.Until(claims.ExpiresAt.Time)
	if err := s.redis.Set(ctx, fmt.Sprintf("zosterix:blocklist:refresh:%s", claims.JTI), "", remaining).Err(); err != nil {
		log.Warn().Err(err).Msg("failed to blocklist old token in redis")
	}
	s.redis.SRem(ctx, fmt.Sprintf("zosterix:user_refresh_jtis:%s", user.ID), claims.JTI)
	s.redis.SAdd(ctx, fmt.Sprintf("zosterix:user_refresh_jtis:%s", user.ID), newJTI)

	profileComplete, _ := s.repo.IsProfileComplete(ctx, user.ID)

	return accessToken, newRefreshToken, user, profileComplete, nil
}

func (s *Service) Logout(ctx context.Context, refreshToken string) error {
	claims, err := ValidateRefreshToken(refreshToken, s.refreshSecret)
	if err != nil {
		return nil // idempotent
	}

	remaining := time.Until(claims.ExpiresAt.Time)
	if remaining < 1*time.Second {
		remaining = 1 * time.Second
	}

	if err := s.redis.Set(ctx, fmt.Sprintf("zosterix:blocklist:refresh:%s", claims.JTI), "", remaining).Err(); err != nil {
		log.Warn().Err(err).Msg("failed to blocklist token on logout in redis")
	}
	s.redis.SRem(ctx, fmt.Sprintf("zosterix:user_refresh_jtis:%s", claims.UserID), claims.JTI)

	return nil
}

func (s *Service) ForgotPassword(ctx context.Context, email string) error {
	user, err := s.repo.GetUserByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil || !user.EmailVerified {
		return nil // generic success
	}

	s.repo.InvalidateTokens(ctx, user.ID, "password_reset")

	rawToken := generateSecureToken(32)
	tokenHash := hashToken(rawToken)

	authToken := &AuthToken{
		UserID:    user.ID,
		TokenHash: tokenHash,
		Type:      "password_reset",
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}

	if err := s.repo.CreateAuthToken(ctx, authToken); err != nil {
		return err
	}

	_ = s.email.SendPasswordResetEmail(user.Email, rawToken)
	return nil
}

func (s *Service) ResetPassword(ctx context.Context, rawToken, newPassword string) error {
	tokenHash := hashToken(rawToken)
	token, err := s.repo.GetAuthTokenByHash(ctx, tokenHash, "password_reset")
	if err != nil {
		return ErrInvalidToken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), 12)
	if err != nil {
		return err
	}

	if err := s.repo.UpdatePassword(ctx, token.UserID, string(hash)); err != nil {
		return err
	}

	if err := s.repo.MarkTokenUsed(ctx, token.ID); err != nil {
		return err
	}

	// Revoke all sessions
	jtis, err := s.redis.SMembers(ctx, fmt.Sprintf("zosterix:user_refresh_jtis:%s", token.UserID)).Result()
	if err != nil {
		log.Warn().Err(err).Msg("failed to get jtist to revoke in redis")
	} else {
		for _, jti := range jtis {
			s.redis.Set(ctx, fmt.Sprintf("zosterix:blocklist:refresh:%s", jti), "", 30*24*time.Hour)
		}
		s.redis.Del(ctx, fmt.Sprintf("zosterix:user_refresh_jtis:%s", token.UserID))
	}

	return nil
}

func (s *Service) ResendVerification(ctx context.Context, email string) error {
	user, err := s.repo.GetUserByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
	if err != nil || user.EmailVerified {
		return nil
	}

	s.repo.InvalidateTokens(ctx, user.ID, "email_verification")

	rawToken := generateSecureToken(32)
	tokenHash := hashToken(rawToken)

	authToken := &AuthToken{
		UserID:    user.ID,
		TokenHash: tokenHash,
		Type:      "email_verification",
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	if err := s.repo.CreateAuthToken(ctx, authToken); err != nil {
		return err
	}

	if err := s.redis.Set(ctx, fmt.Sprintf("zosterix:unverified_delete:%s", user.ID), "", 7*24*time.Hour).Err(); err != nil {
		log.Warn().Err(err).Msg("failed to set unverified_delete in redis (resend)")
	}
	_ = s.email.SendVerificationEmail(user.Email, user.FullName, rawToken)

	return nil
}

func (s *Service) HandleGoogleAuth(ctx context.Context, gUser GoogleUser) (string, string, bool, error) {
	// Try find by Google ID
	user, err := s.repo.GetUserByGoogleID(ctx, gUser.ID)
	if err != nil {
		// Try find by email
		user, err = s.repo.GetUserByEmail(ctx, gUser.Email)
		if err == nil {
			// Link account
			if err := s.repo.LinkGoogleAccount(ctx, user.ID, gUser.ID); err != nil {
				return "", "", false, err
			}
		} else {
			// Create new user
			user = &User{
				Email:            gUser.Email,
				FullName:         gUser.Name,
				Role:             "researcher",
				SupervisorStatus: "none",
				EmailVerified:         true,
				GoogleOAuthID:         &gUser.ID,
				NotificationsEnabled:  true,
				NotificationsPriority: "medium",
			}
			if err := s.repo.CreateUser(ctx, user); err != nil {
				return "", "", false, err
			}
		}
	}

	if user.IsBanned || user.IsSuspended {
		return "", "", false, ErrAccountBanned
	}

	accessToken, err := GenerateAccessToken(user.ID.String(), user.Email, user.Role, user.SupervisorStatus, s.jwtSecret)
	if err != nil {
		return "", "", false, err
	}

	refreshToken, jti, err := GenerateRefreshToken(user.ID.String(), s.refreshSecret)
	if err != nil {
		return "", "", false, err
	}

	if err := s.redis.SAdd(ctx, fmt.Sprintf("zosterix:user_refresh_jtis:%s", user.ID), jti).Err(); err != nil {
		log.Warn().Err(err).Msg("failed to track google refresh token in redis")
	} else {
		s.redis.Expire(ctx, fmt.Sprintf("zosterix:user_refresh_jtis:%s", user.ID), 30*24*time.Hour)
	}

	profileComplete, _ := s.repo.IsProfileComplete(ctx, user.ID)

	return accessToken, refreshToken, profileComplete, nil
}

func generateSecureToken(length int) string {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return ""
	}
	return hex.EncodeToString(b)
}

func hashToken(token string) string {
	h := sha256.New()
	h.Write([]byte(token))
	return hex.EncodeToString(h.Sum(nil))
}

