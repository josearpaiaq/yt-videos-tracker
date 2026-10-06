package db

import (
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Open connects to Postgres and migrates the schema.
func Open(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{TranslateError: true})
	if err != nil {
		return nil, err
	}
	if err := Migrate(db); err != nil {
		return nil, err
	}
	return db, nil
}

func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(&models.User{}, &models.Session{}, &models.List{}, &models.Video{})
}
