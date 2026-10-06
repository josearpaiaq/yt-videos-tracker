package handlers

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/auth"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/youtube"
	"gorm.io/gorm"
)

type VideoFetcher interface {
	FetchVideo(ctx context.Context, id string) (youtube.Metadata, error)
}

type Handler struct {
	db     *gorm.DB
	yt     VideoFetcher
	auth   *auth.Service
	google auth.GoogleVerifier
}

func New(db *gorm.DB, yt VideoFetcher, authService *auth.Service, google auth.GoogleVerifier) *Handler {
	return &Handler{db: db, yt: yt, auth: authService, google: google}
}

func (h *Handler) Router() *gin.Engine {
	r := gin.Default()
	_ = r.SetTrustedProxies(nil)

	api := r.Group("/api")
	api.POST("/auth/google", h.loginWithGoogle)
	api.POST("/auth/refresh", h.refresh)
	api.POST("/auth/logout", h.logout)

	protected := api.Group("", h.auth.Middleware())
	protected.GET("/me", h.me)

	protected.GET("/lists", h.listLists)
	protected.POST("/lists", h.createList)
	protected.PATCH("/lists/:id", h.renameList)
	protected.DELETE("/lists/:id", h.deleteList)

	protected.GET("/videos", h.listVideos)
	protected.POST("/videos", h.createVideo)
	protected.PATCH("/videos/:id", h.updateVideo)
	protected.DELETE("/videos/:id", h.deleteVideo)

	return r
}

func errorJSON(c *gin.Context, status int, msg string) {
	c.AbortWithStatusJSON(status, gin.H{"error": msg})
}

func parseID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		errorJSON(c, http.StatusBadRequest, "invalid id")
		return 0, false
	}
	return uint(id), true
}

// scoped restricts queries to rows owned by the authenticated user.
func (h *Handler) scoped(c *gin.Context) *gorm.DB {
	return h.db.Where("user_id = ?", auth.UserID(c))
}
