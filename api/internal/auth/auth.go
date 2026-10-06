package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/models"
	"gorm.io/gorm"
)

const (
	AccessTTL = 15 * time.Minute
	// SessionTTL is a sliding window: every refresh pushes the expiry forward,
	// so the user only has to sign in again after this long without using the app.
	SessionTTL = 60 * 24 * time.Hour
	// RotationGrace lets a just-rotated refresh token still mint access tokens,
	// so concurrent refreshes from several tabs or the extension don't look like reuse.
	RotationGrace = 30 * time.Second
)

var (
	ErrInvalidToken   = errors.New("invalid token")
	ErrInvalidSession = errors.New("invalid session")
)

type Service struct {
	db     *gorm.DB
	secret []byte
	now    func() time.Time
}

func NewService(db *gorm.DB, secret string) *Service {
	return &Service{db: db, secret: []byte(secret), now: time.Now}
}

func (s *Service) IssueAccessToken(userID uint) (string, error) {
	now := s.now()
	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatUint(uint64(userID), 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(AccessTTL)),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secret)
}

func (s *Service) ParseAccessToken(token string) (uint, error) {
	var claims jwt.RegisteredClaims
	_, err := jwt.ParseWithClaims(token, &claims, func(*jwt.Token) (any, error) {
		return s.secret, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithTimeFunc(s.now))
	if err != nil {
		return 0, ErrInvalidToken
	}
	id, err := strconv.ParseUint(claims.Subject, 10, 64)
	if err != nil {
		return 0, ErrInvalidToken
	}
	return uint(id), nil
}

// CreateSession starts a new refresh-token session and returns the raw token.
func (s *Service) CreateSession(userID uint) (string, error) {
	token, err := randomToken()
	if err != nil {
		return "", err
	}
	session := models.Session{
		UserID:    userID,
		TokenHash: hashToken(token),
		ExpiresAt: s.now().Add(SessionTTL),
	}
	if err := s.db.Create(&session).Error; err != nil {
		return "", err
	}
	return token, nil
}

// RefreshSession rotates the refresh token and slides the session expiry.
// newToken is empty when the token was already rotated within the grace
// period: the caller should keep the cookie the concurrent request set.
// Presenting a rotated token after the grace period revokes the session.
func (s *Service) RefreshSession(token string) (userID uint, newToken string, err error) {
	now := s.now()
	hash := hashToken(token)

	var session models.Session
	err = s.db.Where("token_hash = ?", hash).First(&session).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return s.handleRotatedToken(hash)
	}
	if err != nil {
		return 0, "", err
	}
	if session.RevokedAt != nil || now.After(session.ExpiresAt) {
		return 0, "", ErrInvalidSession
	}

	newToken, err = randomToken()
	if err != nil {
		return 0, "", err
	}
	// Conditional update so only one of several concurrent refreshes rotates.
	res := s.db.Model(&models.Session{}).
		Where("id = ? AND token_hash = ?", session.ID, hash).
		Updates(map[string]any{
			"token_hash":      hashToken(newToken),
			"prev_token_hash": hash,
			"rotated_at":      now,
			"expires_at":      now.Add(SessionTTL),
		})
	if res.Error != nil {
		return 0, "", res.Error
	}
	if res.RowsAffected == 0 {
		return s.handleRotatedToken(hash)
	}
	return session.UserID, newToken, nil
}

func (s *Service) handleRotatedToken(hash string) (uint, string, error) {
	var session models.Session
	err := s.db.Where("prev_token_hash = ?", hash).First(&session).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, "", ErrInvalidSession
	}
	if err != nil {
		return 0, "", err
	}
	if session.RevokedAt != nil {
		return 0, "", ErrInvalidSession
	}
	if session.RotatedAt != nil && s.now().Sub(*session.RotatedAt) <= RotationGrace {
		return session.UserID, "", nil
	}
	// Old token replayed long after rotation: assume it leaked.
	if err := s.db.Model(&session).Update("revoked_at", s.now()).Error; err != nil {
		return 0, "", err
	}
	return 0, "", ErrInvalidSession
}

func (s *Service) RevokeSession(token string) error {
	hash := hashToken(token)
	return s.db.Model(&models.Session{}).
		Where("(token_hash = ? OR prev_token_hash = ?) AND revoked_at IS NULL", hash, hash).
		Update("revoked_at", s.now()).Error
}

func randomToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
