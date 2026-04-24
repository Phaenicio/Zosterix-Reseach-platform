package user

import "github.com/gin-gonic/gin"

type Handler struct{}

func NewHandler() *Handler { return &Handler{} }

func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.GET("/:id", func(c *gin.Context) {})
}
