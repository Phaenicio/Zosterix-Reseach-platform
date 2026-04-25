package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"zosterix-backend/internal/shared"
)

func CSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead || c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}

		token := c.GetHeader("X-CSRF-Token")
		if strings.TrimSpace(token) == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, shared.Fail("csrf_token_required"))
			return
		}
		c.Next()
	}
}
