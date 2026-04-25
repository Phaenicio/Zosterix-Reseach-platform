package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"zosterix-backend/internal/shared"
)

func Recovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		c.AbortWithStatusJSON(http.StatusInternalServerError, shared.Fail("internal_server_error"))
	})
}
