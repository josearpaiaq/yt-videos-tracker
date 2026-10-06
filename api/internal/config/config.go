package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL    string
	YouTubeAPIKey  string
	GoogleClientID string
	JWTSecret      string
	Port           string
}

// Load reads configuration from the environment, loading a .env file first if present.
func Load() (Config, error) {
	_ = godotenv.Load()

	cfg := Config{
		DatabaseURL:    os.Getenv("DATABASE_URL"),
		YouTubeAPIKey:  os.Getenv("YOUTUBE_API_KEY"),
		GoogleClientID: os.Getenv("GOOGLE_CLIENT_ID"),
		JWTSecret:      os.Getenv("JWT_SECRET"),
		Port:           os.Getenv("PORT"),
	}
	if cfg.DatabaseURL == "" {
		return cfg, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.YouTubeAPIKey == "" {
		return cfg, fmt.Errorf("YOUTUBE_API_KEY is required")
	}
	if cfg.GoogleClientID == "" {
		return cfg, fmt.Errorf("GOOGLE_CLIENT_ID is required")
	}
	if len(cfg.JWTSecret) < 32 {
		return cfg, fmt.Errorf("JWT_SECRET must be at least 32 characters")
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	return cfg, nil
}
