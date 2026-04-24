package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"olaleafnet-backend/internal/shared"
)

func RequireRoles(roles ...string) gin.HandlerFunc {
	allow := map[string]bool{}
	for _, role := range roles {
		allow[role] = true
	}

	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if !allow[role.(string)] {
			c.AbortWithStatusJSON(http.StatusForbidden, shared.Fail("forbidden"))
			return
		}
		c.Next()
	}
}
