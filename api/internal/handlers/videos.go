package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/auth"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/models"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/youtube"
	"gorm.io/gorm"
)

type createVideoInput struct {
	URL    string `json:"url"`
	ListID *uint  `json:"list_id"`
}

// optionalID distinguishes an absent field from an explicit null.
type optionalID struct {
	Set   bool
	Value *uint
}

func (o *optionalID) UnmarshalJSON(b []byte) error {
	o.Set = true
	if string(b) == "null" {
		return nil
	}
	var v uint
	if err := json.Unmarshal(b, &v); err != nil {
		return err
	}
	o.Value = &v
	return nil
}

type updateVideoInput struct {
	PositionSeconds *int                `json:"position_seconds"`
	Status          *models.VideoStatus `json:"status"`
	Notes           *string             `json:"notes"`
	ListID          optionalID          `json:"list_id"`
}

// listVideos supports ?list_id=<id>|none, ?status=pending|watching|done and ?youtube_id=<id>.
func (h *Handler) listVideos(c *gin.Context) {
	q := h.scoped(c).Order("updated_at DESC")

	if ytID := c.Query("youtube_id"); ytID != "" {
		q = q.Where("youtube_id = ?", ytID)
	}

	switch listID := c.Query("list_id"); listID {
	case "":
	case "none":
		q = q.Where("list_id IS NULL")
	default:
		id, err := strconv.ParseUint(listID, 10, 64)
		if err != nil {
			errorJSON(c, http.StatusBadRequest, "invalid list_id")
			return
		}
		q = q.Where("list_id = ?", id)
	}

	if status := models.VideoStatus(c.Query("status")); status != "" {
		if !status.Valid() {
			errorJSON(c, http.StatusBadRequest, "invalid status")
			return
		}
		q = q.Where("status = ?", status)
	}

	videos := []models.Video{}
	if err := q.Find(&videos).Error; err != nil {
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, videos)
}

func (h *Handler) createVideo(c *gin.Context) {
	var in createVideoInput
	if err := c.ShouldBindJSON(&in); err != nil {
		errorJSON(c, http.StatusBadRequest, "invalid body")
		return
	}

	ytID, start, err := youtube.ParseURL(in.URL)
	if err != nil {
		errorJSON(c, http.StatusBadRequest, err.Error())
		return
	}

	var existing models.Video
	err = h.scoped(c).Where("youtube_id = ?", ytID).First(&existing).Error
	if err == nil {
		c.AbortWithStatusJSON(http.StatusConflict, gin.H{"error": "video already added", "video_id": existing.ID})
		return
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return
	}

	if !h.ensureListExists(c, in.ListID) {
		return
	}

	meta, err := h.yt.FetchVideo(c.Request.Context(), ytID)
	if errors.Is(err, youtube.ErrNotFound) {
		errorJSON(c, http.StatusNotFound, err.Error())
		return
	}
	if err != nil {
		errorJSON(c, http.StatusBadGateway, "could not fetch video info: "+err.Error())
		return
	}

	video := models.Video{
		UserID:          auth.UserID(c),
		YouTubeID:       ytID,
		Title:           meta.Title,
		Channel:         meta.Channel,
		ThumbnailURL:    meta.ThumbnailURL,
		DurationSeconds: meta.DurationSeconds,
		Status:          models.StatusPending,
		ListID:          in.ListID,
	}
	setPosition(&video, start)

	if err := h.db.Create(&video).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			errorJSON(c, http.StatusConflict, "video already added")
			return
		}
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusCreated, video)
}

func (h *Handler) updateVideo(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	var in updateVideoInput
	if err := c.ShouldBindJSON(&in); err != nil {
		errorJSON(c, http.StatusBadRequest, "invalid body")
		return
	}

	var video models.Video
	if err := h.scoped(c).First(&video, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			errorJSON(c, http.StatusNotFound, "video not found")
			return
		}
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return
	}

	if in.Status != nil {
		if !in.Status.Valid() {
			errorJSON(c, http.StatusBadRequest, "invalid status")
			return
		}
		video.Status = *in.Status
	}
	if in.PositionSeconds != nil {
		if *in.PositionSeconds < 0 {
			errorJSON(c, http.StatusBadRequest, "position_seconds must be >= 0")
			return
		}
		setPosition(&video, *in.PositionSeconds)
	}
	if in.Notes != nil {
		video.Notes = *in.Notes
	}
	if in.ListID.Set {
		if !h.ensureListExists(c, in.ListID.Value) {
			return
		}
		video.ListID = in.ListID.Value
	}

	if err := h.db.Save(&video).Error; err != nil {
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, video)
}

func (h *Handler) deleteVideo(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}
	res := h.scoped(c).Delete(&models.Video{}, id)
	if res.Error != nil {
		errorJSON(c, http.StatusInternalServerError, res.Error.Error())
		return
	}
	if res.RowsAffected == 0 {
		errorJSON(c, http.StatusNotFound, "video not found")
		return
	}
	c.Status(http.StatusNoContent)
}

// setPosition clamps the position to the video duration (when known) and
// moves a pending video to watching once it has progress.
func setPosition(v *models.Video, seconds int) {
	if v.DurationSeconds > 0 && seconds > v.DurationSeconds {
		seconds = v.DurationSeconds
	}
	v.PositionSeconds = seconds
	if seconds > 0 && v.Status == models.StatusPending {
		v.Status = models.StatusWatching
	}
}

func (h *Handler) ensureListExists(c *gin.Context, listID *uint) bool {
	if listID == nil {
		return true
	}
	var count int64
	if err := h.scoped(c).Model(&models.List{}).Where("id = ?", *listID).Count(&count).Error; err != nil {
		errorJSON(c, http.StatusInternalServerError, err.Error())
		return false
	}
	if count == 0 {
		errorJSON(c, http.StatusBadRequest, "list not found")
		return false
	}
	return true
}
