package auth

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

type User struct {
	ID                    uuid.UUID
	Email                 string
	PasswordHash          *string
	FullName              string
	Role                  string
	SupervisorStatus      string
	EmailVerified         bool
	GoogleOAuthID         *string
	IsSuspended           bool
	IsBanned              bool
	NotificationsEnabled  bool
	NotificationsPriority string
	CreatedAt             time.Time
	UpdatedAt             time.Time
}

type ResearcherProfile struct {
	UserID            uuid.UUID              `json:"user_id"`
	DisplayName       *string                `json:"display_name"`
	Bio               *string                `json:"bio"`
	Institution       *string                `json:"institution"`
	ResearchInterests []string               `json:"research_interests"`
	ProfilePhotoURL   *string                `json:"profile_photo_url"`
	SocialLinks       map[string]interface{} `json:"social_links"`
	EmailNotifPrefs   map[string]interface{} `json:"email_notif_prefs"`
	CoauthorConsent   bool                   `json:"coauthor_consent"`
	CreatedAt         time.Time              `json:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at"`
}

func (r *Repository) CreateUser(ctx context.Context, user *User) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO users (email, password_hash, full_name, role, supervisor_status, email_verified, google_oauth_id, notifications_enabled, notifications_priority)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, notifications_enabled, notifications_priority, created_at, updated_at`

	err = tx.QueryRow(ctx, query,
		user.Email, user.PasswordHash, user.FullName, user.Role, user.SupervisorStatus, user.EmailVerified, user.GoogleOAuthID, user.NotificationsEnabled, user.NotificationsPriority,
	).Scan(&user.ID, &user.NotificationsEnabled, &user.NotificationsPriority, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return err
	}

	// Create blank profile
	profileQuery := `INSERT INTO researcher_profiles (user_id) VALUES ($1)`
	_, err = tx.Exec(ctx, profileQuery, user.ID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	query := `SELECT id, email, password_hash, full_name, role, supervisor_status, email_verified, google_oauth_id, is_suspended, is_banned, notifications_enabled, notifications_priority, created_at, updated_at FROM users WHERE email = $1`
	var user User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FullName, &user.Role, &user.SupervisorStatus, &user.EmailVerified, &user.GoogleOAuthID, &user.IsSuspended, &user.IsBanned, &user.NotificationsEnabled, &user.NotificationsPriority, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	query := `SELECT id, email, password_hash, full_name, role, supervisor_status, email_verified, google_oauth_id, is_suspended, is_banned, notifications_enabled, notifications_priority, created_at, updated_at FROM users WHERE id = $1`
	var user User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FullName, &user.Role, &user.SupervisorStatus, &user.EmailVerified, &user.GoogleOAuthID, &user.IsSuspended, &user.IsBanned, &user.NotificationsEnabled, &user.NotificationsPriority, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetUserByGoogleID(ctx context.Context, googleID string) (*User, error) {
	query := `SELECT id, email, password_hash, full_name, role, supervisor_status, email_verified, google_oauth_id, is_suspended, is_banned, notifications_enabled, notifications_priority, created_at, updated_at FROM users WHERE google_oauth_id = $1`
	var user User
	err := r.db.QueryRow(ctx, query, googleID).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FullName, &user.Role, &user.SupervisorStatus, &user.EmailVerified, &user.GoogleOAuthID, &user.IsSuspended, &user.IsBanned, &user.NotificationsEnabled, &user.NotificationsPriority, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) UpdateEmailVerified(ctx context.Context, userID uuid.UUID, verified bool) error {
	query := `UPDATE users SET email_verified = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(ctx, query, verified, userID)
	return err
}

func (r *Repository) UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(ctx, query, passwordHash, userID)
	return err
}

func (r *Repository) LinkGoogleAccount(ctx context.Context, userID uuid.UUID, googleID string) error {
	query := `UPDATE users SET google_oauth_id = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(ctx, query, googleID, userID)
	return err
}

func (r *Repository) UpdateUserSettings(ctx context.Context, userID uuid.UUID, enabled bool, priority string) error {
	query := `UPDATE users SET notifications_enabled = $1, notifications_priority = $2, updated_at = NOW() WHERE id = $3`
	_, err := r.db.Exec(ctx, query, enabled, priority, userID)
	return err
}

func (r *Repository) UpdateUserFullName(ctx context.Context, userID uuid.UUID, fullName string) error {
	query := `UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(ctx, query, fullName, userID)
	return err
}

func (r *Repository) GetResearcherProfile(ctx context.Context, userID uuid.UUID) (*ResearcherProfile, error) {
	query := `SELECT user_id, display_name, bio, institution, research_interests, profile_photo_url, social_links, email_notif_prefs, coauthor_consent, created_at, updated_at FROM researcher_profiles WHERE user_id = $1`
	var p ResearcherProfile
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&p.UserID, &p.DisplayName, &p.Bio, &p.Institution, &p.ResearchInterests, &p.ProfilePhotoURL, &p.SocialLinks, &p.EmailNotifPrefs, &p.CoauthorConsent, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) UpdateResearcherProfile(ctx context.Context, p *ResearcherProfile) error {
	query := `
		INSERT INTO researcher_profiles (user_id, display_name, bio, institution, research_interests, social_links, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			display_name = EXCLUDED.display_name,
			bio = EXCLUDED.bio,
			institution = EXCLUDED.institution,
			research_interests = EXCLUDED.research_interests,
			social_links = EXCLUDED.social_links,
			updated_at = NOW()`
	
	_, err := r.db.Exec(ctx, query,
		p.UserID, p.DisplayName, p.Bio, p.Institution, p.ResearchInterests, p.SocialLinks,
	)
	return err
}

// Token operations
type AuthToken struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	TokenHash string
	Type      string
	NewEmail  *string
	ExpiresAt time.Time
	UsedAt    *time.Time
}

func (r *Repository) CreateAuthToken(ctx context.Context, token *AuthToken) error {
	query := `
		INSERT INTO auth_tokens (user_id, token_hash, token_type, new_email, expires_at)
		VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, token.UserID, token.TokenHash, token.Type, token.NewEmail, token.ExpiresAt)
	return err
}

func (r *Repository) GetAuthTokenByHash(ctx context.Context, hash string, tokenType string) (*AuthToken, error) {
	query := `SELECT id, user_id, token_hash, token_type, new_email, expires_at, used_at FROM auth_tokens WHERE token_hash = $1 AND token_type = $2 AND used_at IS NULL AND expires_at > NOW()`
	var token AuthToken
	err := r.db.QueryRow(ctx, query, hash, tokenType).Scan(
		&token.ID, &token.UserID, &token.TokenHash, &token.Type, &token.NewEmail, &token.ExpiresAt, &token.UsedAt,
	)
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *Repository) MarkTokenUsed(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE auth_tokens SET used_at = NOW() WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *Repository) InvalidateTokens(ctx context.Context, userID uuid.UUID, tokenType string) error {
	query := `UPDATE auth_tokens SET used_at = NOW() WHERE user_id = $1 AND token_type = $2 AND used_at IS NULL`
	_, err := r.db.Exec(ctx, query, userID, tokenType)
	return err
}

func (r *Repository) IsProfileComplete(ctx context.Context, userID uuid.UUID) (bool, error) {
	query := `SELECT display_name IS NOT NULL FROM researcher_profiles WHERE user_id = $1`
	var complete bool
	err := r.db.QueryRow(ctx, query, userID).Scan(&complete)
	if err != nil {
		if err == pgx.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return complete, nil
}
