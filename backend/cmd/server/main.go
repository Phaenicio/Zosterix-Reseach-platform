package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"olaleafnet-backend/internal/auth"
	"olaleafnet-backend/internal/middleware"
	"olaleafnet-backend/internal/shared"
)

func main() {
	_ = godotenv.Load()

	cfg := shared.LoadConfig()
	if err := cfg.Validate(); err != nil {
		log.Printf("config warning: %v", err)
	}

	ctx := context.Background()
	db, _ := shared.NewDB(ctx, cfg.DatabaseURL)
	if db != nil {
		defer db.Close()
	}

	r := gin.New()
	r.Use(middleware.RequestLogger(), middleware.Recovery())
	r.Use(cors.New(cors.Config{AllowOrigins: []string{cfg.FrontendOrigin}, AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, AllowHeaders: []string{"Authorization", "Content-Type", "X-CSRF-Token"}, AllowCredentials: true}))
	r.Use(middleware.CSRFMiddleware(), middleware.RateLimit())

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, shared.Success(gin.H{"status": "up", "service": "zosterix-backend"}, nil))
	})

	api := r.Group("/api/v1")
	authRepo := auth.NewRepository(db)
	authService := auth.NewService(authRepo, cfg.JWTSecret, cfg.JWTRefreshSecret)
	authHandler := auth.NewHandler(authService)
	authHandler.RegisterRoutes(api.Group("/auth"))

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: r}
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}
