package db

import (
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Open connects to Postgres and migrates the schema.
func Open(dsn string) (*gorm.DB, error) {
	// Simple protocol avoids server-side prepared statements, which Neon's
	// pooler (PgBouncer) shares across connections: after a schema change a
	// cached "SELECT *" plan fails with "cached plan must not change result type".
	db, err := gorm.Open(postgres.New(postgres.Config{DSN: dsn, PreferSimpleProtocol: true}), &gorm.Config{TranslateError: true})
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
