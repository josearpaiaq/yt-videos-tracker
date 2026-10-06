package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/auth"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/models"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/testdb"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/youtube"
)

// fakeGoogle accepts any credential and uses it as the Google subject.
type fakeGoogle struct{}

func (fakeGoogle) Verify(_ context.Context, credential string) (auth.GoogleIdentity, error) {
	if credential == "bad" {
		return auth.GoogleIdentity{}, errors.New("invalid")
	}
	return auth.GoogleIdentity{Subject: credential, Email: credential + "@example.com"}, nil
}

type fakeYouTube struct{}

func (fakeYouTube) FetchVideo(_ context.Context, id string) (youtube.Metadata, error) {
	return youtube.Metadata{Title: "Video " + id, Channel: "Channel", DurationSeconds: 600}, nil
}

func newServer(t *testing.T) *httptest.Server {
	t.Helper()
	gin.SetMode(gin.TestMode)
	db := testdb.Open(t)
	h := New(db, fakeYouTube{}, auth.NewService(db, "test-secret-test-secret-test-secret"), fakeGoogle{})
	// TLS so the client's cookie jar sends the Secure cookies.
	srv := httptest.NewTLSServer(h.Router())
	t.Cleanup(srv.Close)
	return srv
}

type client struct {
	t   *testing.T
	srv *httptest.Server
	c   *http.Client
}

func newClient(t *testing.T, srv *httptest.Server) *client {
	jar, _ := cookiejar.New(nil)
	// srv.Client() is shared, so build a client per user with its own jar.
	c := &http.Client{Transport: srv.Client().Transport, Jar: jar}
	return &client{t: t, srv: srv, c: c}
}

func (c *client) do(method, path string, body any, out any) int {
	c.t.Helper()
	var buf bytes.Buffer
	if body != nil {
		_ = json.NewEncoder(&buf).Encode(body)
	}
	req, _ := http.NewRequest(method, c.srv.URL+path, &buf)
	req.Header.Set("Content-Type", "application/json")
	res, err := c.c.Do(req)
	if err != nil {
		c.t.Fatal(err)
	}
	defer res.Body.Close()
	if out != nil {
		_ = json.NewDecoder(res.Body).Decode(out)
	}
	return res.StatusCode
}

func (c *client) login(sub string) {
	c.t.Helper()
	if code := c.do("POST", "/api/auth/google", map[string]string{"credential": sub}, nil); code != http.StatusOK {
		c.t.Fatalf("login: status %d", code)
	}
}

func TestProtectedRoutesRequireAuth(t *testing.T) {
	srv := newServer(t)
	anon := newClient(t, srv)

	for _, path := range []string{"/api/me", "/api/videos", "/api/lists"} {
		if code := anon.do("GET", path, nil, nil); code != http.StatusUnauthorized {
			t.Errorf("GET %s: status %d, want 401", path, code)
		}
	}
	if code := anon.do("POST", "/api/auth/google", map[string]string{"credential": "bad"}, nil); code != http.StatusUnauthorized {
		t.Errorf("bad credential: status %d, want 401", code)
	}
}

func TestLoginRefreshLogout(t *testing.T) {
	srv := newServer(t)
	c := newClient(t, srv)
	c.login("alice")

	var me models.User
	if code := c.do("GET", "/api/me", nil, &me); code != http.StatusOK || me.Email != "alice@example.com" {
		t.Fatalf("me: status %d, user %+v", code, me)
	}
	if code := c.do("POST", "/api/auth/refresh", nil, nil); code != http.StatusNoContent {
		t.Fatalf("refresh: status %d", code)
	}
	if code := c.do("POST", "/api/auth/logout", nil, nil); code != http.StatusNoContent {
		t.Fatalf("logout: status %d", code)
	}
	if code := c.do("GET", "/api/me", nil, nil); code != http.StatusUnauthorized {
		t.Errorf("me after logout: status %d, want 401", code)
	}
	if code := c.do("POST", "/api/auth/refresh", nil, nil); code != http.StatusUnauthorized {
		t.Errorf("refresh after logout: status %d, want 401", code)
	}
}

func TestUsersOnlySeeTheirOwnData(t *testing.T) {
	srv := newServer(t)
	alice, bob := newClient(t, srv), newClient(t, srv)
	alice.login("alice")
	bob.login("bob")

	var list models.List
	alice.do("POST", "/api/lists", map[string]string{"name": "Go"}, &list)

	var video models.Video
	code := alice.do("POST", "/api/videos", map[string]any{
		"url":     "https://youtu.be/dQw4w9WgXcQ?t=90",
		"list_id": list.ID,
	}, &video)
	if code != http.StatusCreated || video.PositionSeconds != 90 || video.Status != models.StatusWatching {
		t.Fatalf("create video: status %d, video %+v", code, video)
	}

	// Bob sees nothing of Alice's and cannot touch it.
	var videos []models.Video
	bob.do("GET", "/api/videos", nil, &videos)
	if len(videos) != 0 {
		t.Errorf("bob sees %d videos, want 0", len(videos))
	}
	videoPath := fmt.Sprintf("/api/videos/%d", video.ID)
	if code := bob.do("PATCH", videoPath, map[string]int{"position_seconds": 1}, nil); code != http.StatusNotFound {
		t.Errorf("bob patch: status %d, want 404", code)
	}
	if code := bob.do("DELETE", videoPath, nil, nil); code != http.StatusNotFound {
		t.Errorf("bob delete: status %d, want 404", code)
	}
	if code := bob.do("POST", "/api/videos", map[string]any{"url": "dQw4w9WgXcQ", "list_id": list.ID}, nil); code != http.StatusBadRequest {
		t.Errorf("bob using alice's list: status %d, want 400", code)
	}

	// Both can track the same video and use the same list name.
	if code := bob.do("POST", "/api/videos", map[string]any{"url": "dQw4w9WgXcQ"}, nil); code != http.StatusCreated {
		t.Errorf("bob adding same video: status %d, want 201", code)
	}
	if code := bob.do("POST", "/api/lists", map[string]string{"name": "Go"}, nil); code != http.StatusCreated {
		t.Errorf("bob same list name: status %d, want 201", code)
	}
	if code := alice.do("POST", "/api/videos", map[string]any{"url": "dQw4w9WgXcQ"}, nil); code != http.StatusConflict {
		t.Errorf("alice duplicate: status %d, want 409", code)
	}
}

func TestFindVideoByYouTubeID(t *testing.T) {
	srv := newServer(t)
	c := newClient(t, srv)
	c.login("alice")
	c.do("POST", "/api/videos", map[string]any{"url": "dQw4w9WgXcQ"}, nil)

	var found []models.Video
	c.do("GET", "/api/videos?youtube_id=dQw4w9WgXcQ", nil, &found)
	if len(found) != 1 {
		t.Errorf("found %d videos, want 1", len(found))
	}
	c.do("GET", "/api/videos?youtube_id=aaaaaaaaaaa", nil, &found)
	if len(found) != 0 {
		t.Errorf("found %d videos for unknown id, want 0", len(found))
	}
}
