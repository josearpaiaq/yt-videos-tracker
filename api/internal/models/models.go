package models

import "time"

type VideoStatus string

const (
	StatusPending  VideoStatus = "pending"
	StatusWatching VideoStatus = "watching"
	StatusDone     VideoStatus = "done"
)

func (s VideoStatus) Valid() bool {
	switch s {
	case StatusPending, StatusWatching, StatusDone:
		return true
	}
	return false
}

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	GoogleSub string    `gorm:"uniqueIndex;not null" json:"-"`
	Email     string    `gorm:"not null" json:"email"`
	Name      string    `gorm:"not null;default:''" json:"name"`
	AvatarURL string    `gorm:"not null;default:''" json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Session is a refresh-token session. Only hashes of tokens are stored.
// PrevTokenHash and RotatedAt allow a short grace period for concurrent
// refreshes (e.g. dashboard and extension refreshing at the same time).
type Session struct {
	ID            uint   `gorm:"primaryKey"`
	UserID        uint   `gorm:"not null;index"`
	User          *User  `gorm:"constraint:OnDelete:CASCADE"`
	TokenHash     string `gorm:"uniqueIndex;not null"`
	PrevTokenHash string `gorm:"index;not null;default:''"`
	RotatedAt     *time.Time
	ExpiresAt     time.Time `gorm:"not null"`
	RevokedAt     *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type List struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;uniqueIndex:idx_lists_user_name" json:"-"`
	User      *User     `gorm:"constraint:OnDelete:CASCADE" json:"-"`
	Name      string    `gorm:"not null;uniqueIndex:idx_lists_user_name" json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Video struct {
	ID              uint        `gorm:"primaryKey" json:"id"`
	UserID          uint        `gorm:"not null;uniqueIndex:idx_videos_user_youtube" json:"-"`
	User            *User       `gorm:"constraint:OnDelete:CASCADE" json:"-"`
	YouTubeID       string      `gorm:"column:youtube_id;not null;uniqueIndex:idx_videos_user_youtube" json:"youtube_id"`
	Title           string      `gorm:"not null" json:"title"`
	Channel         string      `gorm:"not null;default:''" json:"channel"`
	ThumbnailURL    string      `gorm:"not null;default:''" json:"thumbnail_url"`
	DurationSeconds int         `gorm:"not null;default:0" json:"duration_seconds"`
	PositionSeconds int         `gorm:"not null;default:0" json:"position_seconds"`
	Status          VideoStatus `gorm:"type:text;not null;default:pending;index" json:"status"`
	Notes           string      `gorm:"not null;default:''" json:"notes"`
	ListID          *uint       `gorm:"index" json:"list_id"`
	List            *List       `gorm:"constraint:OnDelete:SET NULL" json:"-"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}
