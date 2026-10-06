package auth

import (
	"errors"
	"testing"
	"time"

	"github.com/josearpaiaq/yt-videos-tracker/api/internal/models"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/testdb"
)

type clock struct{ t time.Time }

func (c *clock) now() time.Time          { return c.t }
func (c *clock) advance(d time.Duration) { c.t = c.t.Add(d) }

func newTestService(t *testing.T) (*Service, *clock, uint) {
	t.Helper()
	db := testdb.Open(t)
	user := models.User{GoogleSub: "sub-1", Email: "a@example.com"}
	if err := db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	clk := &clock{t: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)}
	s := NewService(db, "test-secret-test-secret-test-secret")
	s.now = clk.now
	return s, clk, user.ID
}

func TestAccessToken(t *testing.T) {
	s, clk, userID := newTestService(t)

	token, err := s.IssueAccessToken(userID)
	if err != nil {
		t.Fatal(err)
	}
	got, err := s.ParseAccessToken(token)
	if err != nil || got != userID {
		t.Fatalf("ParseAccessToken = (%d, %v), want (%d, nil)", got, err, userID)
	}

	if _, err := s.ParseAccessToken(token + "x"); !errors.Is(err, ErrInvalidToken) {
		t.Errorf("tampered token: err = %v, want ErrInvalidToken", err)
	}

	other := NewService(nil, "another-secret-another-secret-another")
	if _, err := other.ParseAccessToken(token); !errors.Is(err, ErrInvalidToken) {
		t.Errorf("wrong secret: err = %v, want ErrInvalidToken", err)
	}

	clk.advance(AccessTTL + time.Second)
	if _, err := s.ParseAccessToken(token); !errors.Is(err, ErrInvalidToken) {
		t.Errorf("expired token: err = %v, want ErrInvalidToken", err)
	}
}

func TestRefreshRotatesToken(t *testing.T) {
	s, _, userID := newTestService(t)
	token, _ := s.CreateSession(userID)

	gotUser, newToken, err := s.RefreshSession(token)
	if err != nil || gotUser != userID {
		t.Fatalf("RefreshSession = (%d, %v), want (%d, nil)", gotUser, err, userID)
	}
	if newToken == "" || newToken == token {
		t.Fatalf("expected a new rotated token, got %q", newToken)
	}
	if _, _, err := s.RefreshSession(newToken); err != nil {
		t.Errorf("rotated token should be valid: %v", err)
	}
}

func TestRefreshGracePeriodForConcurrentRequests(t *testing.T) {
	s, clk, userID := newTestService(t)
	token, _ := s.CreateSession(userID)
	_, newToken, _ := s.RefreshSession(token)

	clk.advance(RotationGrace / 2)
	gotUser, again, err := s.RefreshSession(token)
	if err != nil || gotUser != userID || again != "" {
		t.Fatalf("within grace: got (%d, %q, %v), want (%d, \"\", nil)", gotUser, again, err, userID)
	}
	if _, _, err := s.RefreshSession(newToken); err != nil {
		t.Errorf("current token should still be valid: %v", err)
	}
}

func TestRefreshReuseAfterGraceRevokesSession(t *testing.T) {
	s, clk, userID := newTestService(t)
	token, _ := s.CreateSession(userID)
	_, newToken, _ := s.RefreshSession(token)

	clk.advance(RotationGrace + time.Second)
	if _, _, err := s.RefreshSession(token); !errors.Is(err, ErrInvalidSession) {
		t.Fatalf("reused token: err = %v, want ErrInvalidSession", err)
	}
	if _, _, err := s.RefreshSession(newToken); !errors.Is(err, ErrInvalidSession) {
		t.Errorf("session should be revoked after reuse: err = %v", err)
	}
}

func TestSessionExpirySlides(t *testing.T) {
	s, clk, userID := newTestService(t)
	token, _ := s.CreateSession(userID)

	// Use the app every 50 days: the session never expires.
	for range 3 {
		clk.advance(50 * 24 * time.Hour)
		var err error
		_, token, err = s.RefreshSession(token)
		if err != nil {
			t.Fatalf("refresh after 50 days: %v", err)
		}
	}

	clk.advance(SessionTTL + time.Second)
	if _, _, err := s.RefreshSession(token); !errors.Is(err, ErrInvalidSession) {
		t.Errorf("inactive past TTL: err = %v, want ErrInvalidSession", err)
	}
}

func TestRevokeSession(t *testing.T) {
	s, _, userID := newTestService(t)
	token, _ := s.CreateSession(userID)

	if err := s.RevokeSession(token); err != nil {
		t.Fatal(err)
	}
	if _, _, err := s.RefreshSession(token); !errors.Is(err, ErrInvalidSession) {
		t.Errorf("revoked session: err = %v, want ErrInvalidSession", err)
	}
}
