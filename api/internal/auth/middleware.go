package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	AccessCookie  = "access_token"
	RefreshCookie = "refresh_token"
	userIDKey     = "userID"
)

// Middleware rejects requests without a valid access token cookie.
func (s *Service) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie(AccessCookie)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		userID, err := s.ParseAccessToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.Set(userIDKey, userID)
		c.Next()
	}
}

// UserID returns the authenticated user's ID set by Middleware.
func UserID(c *gin.Context) uint {
	return c.GetUint(userIDKey)
}
