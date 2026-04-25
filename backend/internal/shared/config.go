package shared

import (
	"fmt"
	"os"
)

type Config struct {
	Port             string
	DatabaseURL      string
	RedisURL         string
	JWTSecret        string
	JWTRefreshSecret string
	AppURL           string
	APIURL           string
	FrontendOrigin   string
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:5173"
	}

	return Config{
		Port:             port,
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		RedisURL:         os.Getenv("REDIS_URL"),
		JWTSecret:        os.Getenv("JWT_SECRET"),
		JWTRefreshSecret: os.Getenv("JWT_REFRESH_SECRET"),
		AppURL:           appURL,
		APIURL:           os.Getenv("API_URL"),
		FrontendOrigin:   appURL,
	}
}

func (c Config) Validate() error {
	required := map[string]string{
		"DATABASE_URL":       c.DatabaseURL,
		"REDIS_URL":          c.RedisURL,
		"JWT_SECRET":         c.JWTSecret,
		"JWT_REFRESH_SECRET": c.JWTRefreshSecret,
	}

	for k, v := range required {
		if v == "" {
			return fmt.Errorf("missing required env: %s", k)
		}
	}
	return nil
}
