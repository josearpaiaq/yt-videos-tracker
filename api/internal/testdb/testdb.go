// Package testdb provides an in-memory SQLite database for tests.
package testdb

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/db"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Open(t *testing.T) *gorm.DB {
	t.Helper()
	gdb, err := gorm.Open(sqlite.Open(":memory:?_pragma=foreign_keys(1)"), &gorm.Config{
		TranslateError: true,
		Logger:         logger.Discard,
	})
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, err := gdb.DB()
	if err != nil {
		t.Fatal(err)
	}
	// Each connection to :memory: is a separate database.
	sqlDB.SetMaxOpenConns(1)
	t.Cleanup(func() { sqlDB.Close() })

	if err := db.Migrate(gdb); err != nil {
		t.Fatal(err)
	}
	return gdb
}
