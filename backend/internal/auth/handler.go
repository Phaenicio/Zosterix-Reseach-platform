package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"olaleafnet-backend/internal/shared"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/register", h.register)
	rg.POST("/login", h.login)
	rg.POST("/refresh", h.refresh)
	rg.POST("/logout", h.logout)
	rg.POST("/verify-email", h.notImplemented)
	rg.POST("/resend-verification", h.notImplemented)
	rg.POST("/forgot-password", h.notImplemented)
	rg.POST("/reset-password", h.notImplemented)
	rg.GET("/google", h.notImplemented)
	rg.GET("/google/callback", h.notImplemented)
}

func (h *Handler) register(c *gin.Context) {
	c.JSON(http.StatusCreated, shared.Success(gin.H{"message": "register scaffolded"}, nil))
}
func (h *Handler) login(c *gin.Context) {
	c.JSON(http.StatusOK, shared.Success(gin.H{"message": "login scaffolded"}, nil))
}
func (h *Handler) refresh(c *gin.Context) {
	c.JSON(http.StatusOK, shared.Success(gin.H{"message": "refresh scaffolded"}, nil))
}
func (h *Handler) logout(c *gin.Context) {
	c.JSON(http.StatusOK, shared.Success(gin.H{"message": "logout scaffolded"}, nil))
}
func (h *Handler) notImplemented(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, shared.Fail("not_implemented"))
}
