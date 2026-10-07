package handlers

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/auth"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/models"
	"gorm.io/gorm"
)

type googleLoginInput struct {
	Credential string `json:"credential"`
}

func (h *Handler) loginWithGoogle(c *gin.Context) {
	var in googleLoginInput
	if err := c.ShouldBindJSON(&in); err != nil || in.Credential == "" {
		errorJSON(c, http.StatusBadRequest, "credential is required")
		return
	}
	identity, err := h.google.Verify(c.Request.Context(), in.Credential)
	if err != nil {
		errorJSON(c, http.StatusUnauthorized, "invalid Google credential")
		return
	}

	var user models.User
	err = h.db.Where("google_sub = ?", identity.Subject).First(&user).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return
	}
	user.GoogleSub = identity.Subject
	user.Email = identity.Email
	user.Name = identity.Name
	user.AvatarURL = identity.Picture
	if err := h.db.Save(&user).Error; err != nil {
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return
	}

	refreshToken, err := h.auth.CreateSession(user.ID)
	if err != nil {
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return
	}
	if !h.setAccessCookie(c, user.ID) {
		return
	}
	setRefreshCookie(c, refreshToken)
	c.JSON(http.StatusOK, user)
}

func (h *Handler) refresh(c *gin.Context) {
	token, err := c.Cookie(auth.RefreshCookie)
	if err != nil {
		errorJSON(c, http.StatusUnauthorized, "no session")
		return
	}
	userID, newToken, err := h.auth.RefreshSession(token)
	if errors.Is(err, auth.ErrInvalidSession) {
		clearAuthCookies(c)
		errorJSON(c, http.StatusUnauthorized, "session expired")
		return
	}
	if err != nil {
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return
	}
	if !h.setAccessCookie(c, userID) {
		return
	}
	if newToken != "" {
		setRefreshCookie(c, newToken)
	}
	c.Status(http.StatusNoContent)
}

func (h *Handler) logout(c *gin.Context) {
	if token, err := c.Cookie(auth.RefreshCookie); err == nil {
		if err := h.auth.RevokeSession(token); err != nil {
			errorJSON(c, http.StatusInternalServerError, err.Error())
			return
		}
	}
	clearAuthCookies(c)
	c.Status(http.StatusNoContent)
}

func (h *Handler) me(c *gin.Context) {
	user, ok := h.currentUser(c)
	if !ok {
		return
	}
	c.JSON(http.StatusOK, user)
}

type updateMeInput struct {
	Language *string `json:"language"`
	Theme    *string `json:"theme"`
}

// updateMe changes the user's language and theme preferences.
func (h *Handler) updateMe(c *gin.Context) {
	var in updateMeInput
	if err := c.ShouldBindJSON(&in); err != nil {
		errorJSON(c, http.StatusBadRequest, "invalid body")
		return
	}
	user, ok := h.currentUser(c)
	if !ok {
		return
	}
	if in.Language != nil {
		if *in.Language != "en" && *in.Language != "es" {
			errorJSON(c, http.StatusBadRequest, "language must be en or es")
			return
		}
		user.Language = *in.Language
	}
	if in.Theme != nil {
		if *in.Theme != "system" && *in.Theme != "light" && *in.Theme != "dark" {
			errorJSON(c, http.StatusBadRequest, "theme must be system, light or dark")
			return
		}
		user.Theme = *in.Theme
	}
	if err := h.db.Save(&user).Error; err != nil {
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, user)
}

// currentUser loads the authenticated user. A missing user means the session
// outlived the account (401); any other error is a server error.
func (h *Handler) currentUser(c *gin.Context) (models.User, bool) {
	var user models.User
	err := h.db.First(&user, auth.UserID(c)).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		errorJSON(c, http.StatusUnauthorized, "user not found")
		return user, false
	}
	if err != nil {
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return user, false
	}
	return user, true
}

func (h *Handler) setAccessCookie(c *gin.Context, userID uint) bool {
	token, err := h.auth.IssueAccessToken(userID)
	if err != nil {
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return false
	}
	setCookie(c, auth.AccessCookie, token, "/api", auth.AccessTTL)
	return true
}

func setRefreshCookie(c *gin.Context, token string) {
	setCookie(c, auth.RefreshCookie, token, "/api/auth", auth.SessionTTL)
}

func clearAuthCookies(c *gin.Context) {
	setCookie(c, auth.AccessCookie, "", "/api", -time.Second)
	setCookie(c, auth.RefreshCookie, "", "/api/auth", -time.Second)
}

// setCookie writes an HttpOnly, Secure, SameSite=Lax cookie. Browsers accept
// Secure cookies on http://localhost, so this also works in local development.
func setCookie(c *gin.Context, name, value, path string, maxAge time.Duration) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     path,
		MaxAge:   int(maxAge.Seconds()),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}
