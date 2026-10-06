package main

import (
	"log"

	"github.com/josearpaiaq/yt-videos-tracker/api/internal/auth"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/config"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/db"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/handlers"
	"github.com/josearpaiaq/yt-videos-tracker/api/internal/youtube"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	database, err := db.Open(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}

	h := handlers.New(
		database,
		youtube.NewClient(cfg.YouTubeAPIKey),
		auth.NewService(database, cfg.JWTSecret),
		auth.NewGoogleVerifier(cfg.GoogleClientID),
	)
	if err := h.Router().Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
