package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo *Repository
	accessSecret  []byte
	refreshSecret []byte
}

func NewService(repo *Repository, accessSecret, refreshSecret string) *Service {
	return &Service{repo: repo, accessSecret: []byte(accessSecret), refreshSecret: []byte(refreshSecret)}
}

func (s *Service) HashPassword(password string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(b), err
}

func (s *Service) VerifyPassword(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func (s *Service) SignAccessToken(userID, role string) (string, error) {
	claims := jwt.MapClaims{"sub": userID, "role": role, "exp": time.Now().Add(15 * time.Minute).Unix()}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(s.accessSecret)
}

func (s *Service) SignRefreshToken(userID string) (string, error) {
	claims := jwt.MapClaims{"sub": userID, "exp": time.Now().Add(30 * 24 * time.Hour).Unix()}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(s.refreshSecret)
}
