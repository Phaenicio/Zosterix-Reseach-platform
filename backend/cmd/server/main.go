package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"zosterix-backend/internal/auth"
	"zosterix-backend/internal/middleware"
	"zosterix-backend/internal/shared"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Setup logger
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	config := shared.LoadConfig()

	// Initialize DB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := shared.NewDB(ctx, config.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to database")
	}
	defer db.Close()

	// Initialize Redis
	rdb, err := shared.NewRedis(config.RedisURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to redis")
	}

	// Initialize Auth Module
	authRepo := auth.NewRepository(db)
	emailSvc := auth.NewEmailService(config.ResendAPIKey, config.EmailFrom, config.AppURL)
	authSvc := auth.NewService(authRepo, rdb, emailSvc, config.JWTSecret, config.JWTRefreshSecret)
	authHandler := auth.NewHandler(authSvc)

	// Setup Gin
	if config.Environment == "release" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.SecurityHeaders())
	r.Use(shared.LoggerMiddleware()) // I'll implement this helper later or use a simple one

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{config.FrontendOrigin, "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-CSRF-Token"},
		ExposeHeaders:    []string{"X-RateLimit-Remaining", "Retry-After"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Routes
	// Root route
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Zosterix API is running"})
	})

	api := r.Group("/api/v1")

	// Public Auth Routes
	authGroup := api.Group("/auth")
	{
		// Apply rate limit to critical auth endpoints
		authGroup.POST("/register", auth.RateLimit(rdb, "auth", 5, 15*time.Minute), authHandler.Register)
		authGroup.POST("/login", auth.RateLimit(rdb, "auth", 5, 15*time.Minute), authHandler.Login)
		authGroup.POST("/verify-email", authHandler.VerifyEmail)
		authGroup.POST("/resend-verification", authHandler.ResendVerification)
		authGroup.POST("/refresh", authHandler.RefreshToken)
		authGroup.POST("/logout", authHandler.Logout)
		authGroup.POST("/forgot-password", authHandler.ForgotPassword)
		authGroup.POST("/reset-password", authHandler.ResetPassword)
		authGroup.GET("/google", authHandler.GoogleRedirect)
		authGroup.GET("/google/callback", authHandler.GoogleCallback)
	}

	// Protected Routes
	protected := api.Group("/")
	protected.Use(auth.RequireAuth(config.JWTSecret))
	{
		protected.GET("/users/me", authHandler.GetMe)
		protected.PUT("/users/settings", authHandler.UpdateUserSettings)
		protected.PUT("/users/profile", authHandler.UpdateUserProfile)
	}

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Start server with graceful shutdown
	srv := &http.Server{
		Addr:    ":" + config.Port,
		Handler: r,
	}

	go func() {
		log.Info().Msgf("starting server on port %s", config.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("failed to start server")
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info().Msg("shutting down server...")

	ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("server forced to shutdown")
	}

	log.Info().Msg("server exited")
}
