package auth

import (
	"net/http"
	"time"

	"zosterix-backend/internal/shared"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type registerInput struct {
	FullName string `json:"full_name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=12"`
	Role     string `json:"role" binding:"required,oneof=researcher student supervisor"`
}

func (h *Handler) Register(c *gin.Context) {
	var input registerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		shared.Err(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	req := RegisterRequest{
		FullName: input.FullName,
		Email:    input.Email,
		Password: input.Password,
		Role:     input.Role,
	}

	if err := h.service.Register(c.Request.Context(), req); err != nil {
		if err == ErrEmailTaken {
			shared.Err(c, http.StatusConflict, "email_taken", "Email already registered")
			return
		}
		shared.Err(c, http.StatusInternalServerError, "internal_error", "Failed to register")
		return
	}

	shared.Created(c, gin.H{"message": "Verification email sent. Please check your inbox."})
}

type verifyInput struct {
	Token string `json:"token" binding:"required"`
}

func (h *Handler) VerifyEmail(c *gin.Context) {
	var input verifyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		shared.Err(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	if err := h.service.VerifyEmail(c.Request.Context(), input.Token); err != nil {
		shared.Err(c, http.StatusBadRequest, "invalid_token", "Invalid or expired token")
		return
	}

	shared.OK(c, gin.H{"message": "Email verified successfully. You can now login."})
}

type loginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *Handler) Login(c *gin.Context) {
	var input loginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		shared.Err(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	accessToken, refreshToken, user, profileComplete, err := h.service.Login(c.Request.Context(), input.Email, input.Password)
	if err != nil {
		switch err {
		case ErrInvalidCredentials:
			shared.Err(c, http.StatusUnauthorized, "invalid_credentials", "Incorrect email or password")
		case ErrEmailNotVerified:
			shared.Err(c, http.StatusForbidden, "email_not_verified", "Please verify your email address before logging in.")
		case ErrAccountBanned:
			shared.Err(c, http.StatusForbidden, "account_banned", "Your account has been permanently banned")
		case ErrAccountSuspended:
			shared.Err(c, http.StatusForbidden, "account_suspended", "Your account has been temporarily suspended")
		default:
			shared.Err(c, http.StatusInternalServerError, "internal_error", "Failed to login")
		}
		return
	}

	h.setRefreshCookie(c, refreshToken)

	var profile *ResearcherProfile
	if p, err := h.service.repo.GetResearcherProfile(c.Request.Context(), user.ID); err == nil {
		profile = p
	}

	shared.OK(c, gin.H{
		"access_token": accessToken,
		"user": gin.H{
			"id":                     user.ID,
			"email":                  user.Email,
			"full_name":              user.FullName,
			"role":                   user.Role,
			"supervisor_status":      user.SupervisorStatus,
			"notifications_enabled":  user.NotificationsEnabled,
			"notifications_priority": user.NotificationsPriority,
			"profile_complete":       profileComplete,
			"profile":                profile,
		},
	})
}

func (h *Handler) RefreshToken(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		shared.Err(c, http.StatusUnauthorized, "missing_token", "Session expired")
		return
	}

	accessToken, newRefreshToken, user, profileComplete, err := h.service.RefreshToken(c.Request.Context(), refreshToken)
	if err != nil {
		shared.Err(c, http.StatusUnauthorized, "invalid_token", "Session expired")
		return
	}

	h.setRefreshCookie(c, newRefreshToken)

	var profile *ResearcherProfile
	if p, err := h.service.repo.GetResearcherProfile(c.Request.Context(), user.ID); err == nil {
		profile = p
	}

	shared.OK(c, gin.H{
		"access_token": accessToken,
		"user": gin.H{
			"id":                     user.ID,
			"email":                  user.Email,
			"full_name":              user.FullName,
			"role":                   user.Role,
			"supervisor_status":      user.SupervisorStatus,
			"notifications_enabled":  user.NotificationsEnabled,
			"notifications_priority": user.NotificationsPriority,
			"profile_complete":       profileComplete,
			"profile":                profile,
		},
	})
}

func (h *Handler) Logout(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err == nil {
		_ = h.service.Logout(c.Request.Context(), refreshToken)
	}

	c.SetCookie("refresh_token", "", -1, "/", "", false, true)
	shared.OK(c, gin.H{"message": "Logged out successfully"})
}

func (h *Handler) GetMe(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)
	
	user, err := h.service.repo.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		shared.Err(c, http.StatusNotFound, "user_not_found", "User not found")
		return
	}

	profileComplete, _ := h.service.repo.IsProfileComplete(c.Request.Context(), user.ID)

	var profile *ResearcherProfile
	if p, err := h.service.repo.GetResearcherProfile(c.Request.Context(), user.ID); err == nil {
		profile = p
	}

	shared.OK(c, gin.H{
		"user": gin.H{
			"id":                     user.ID,
			"email":                  user.Email,
			"full_name":              user.FullName,
			"role":                   user.Role,
			"supervisor_status":      user.SupervisorStatus,
			"notifications_enabled":  user.NotificationsEnabled,
			"notifications_priority": user.NotificationsPriority,
			"profile_complete":       profileComplete,
			"profile":                profile,
		},
	})
}

type updateSettingsInput struct {
	NotificationsEnabled  bool   `json:"notifications_enabled"`
	NotificationsPriority string `json:"notifications_priority" binding:"required,oneof=low medium high critical"`
}

func (h *Handler) UpdateUserSettings(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)

	var input updateSettingsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		shared.Err(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	if err := h.service.repo.UpdateUserSettings(c.Request.Context(), userID, input.NotificationsEnabled, input.NotificationsPriority); err != nil {
		shared.Err(c, http.StatusInternalServerError, "internal_error", "Failed to update settings")
		return
	}

	shared.OK(c, gin.H{"message": "Settings updated successfully"})
}

type updateProfileInput struct {
	FullName          string   `json:"full_name" binding:"required,min=2,max=100"`
	DisplayName       string   `json:"display_name"`
	Bio               string   `json:"bio"`
	Institution       string   `json:"institution"`
	ResearchInterests []string `json:"research_interests"`
	GoogleScholar     string   `json:"google_scholar"`
}

func (h *Handler) UpdateUserProfile(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, _ := uuid.Parse(userIDStr)

	var input updateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		shared.Err(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	// Update Full Name in users table
	if err := h.service.repo.UpdateUserFullName(c.Request.Context(), userID, input.FullName); err != nil {
		shared.Err(c, http.StatusInternalServerError, "internal_error", "Failed to update full name")
		return
	}

	// Update Profile
	socialLinks := map[string]interface{}{
		"scholar": input.GoogleScholar,
	}

	profile := &ResearcherProfile{
		UserID:            userID,
		DisplayName:       &input.DisplayName,
		Bio:               &input.Bio,
		Institution:       &input.Institution,
		ResearchInterests: input.ResearchInterests,
		SocialLinks:       socialLinks,
	}

	if err := h.service.repo.UpdateResearcherProfile(c.Request.Context(), profile); err != nil {
		shared.Err(c, http.StatusInternalServerError, "internal_error", "Failed to update profile")
		return
	}

	shared.OK(c, gin.H{"message": "Profile updated successfully"})
}

func (h *Handler) setRefreshCookie(c *gin.Context, token string) {
	c.SetCookie("refresh_token", token, int(30*24*time.Hour.Seconds()), "/", "", false, true)
}

type forgotPasswordInput struct {
	Email string `json:"email" binding:"required,email"`
}

func (h *Handler) ForgotPassword(c *gin.Context) {
	var input forgotPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		shared.Err(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	_ = h.service.ForgotPassword(c.Request.Context(), input.Email)
	shared.OK(c, gin.H{"message": "If that email is registered, a reset link has been sent."})
}

type resetPasswordInput struct {
	Token           string `json:"token" binding:"required"`
	Password        string `json:"password" binding:"required,min=12"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
}

func (h *Handler) ResetPassword(c *gin.Context) {
	var input resetPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		shared.Err(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	if err := h.service.ResetPassword(c.Request.Context(), input.Token, input.Password); err != nil {
		shared.Err(c, http.StatusBadRequest, "invalid_token", "Invalid or expired token")
		return
	}

	shared.OK(c, gin.H{"message": "Password updated successfully. You can now sign in."})
}

func (h *Handler) ResendVerification(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		shared.Err(c, http.StatusBadRequest, "invalid_input", err.Error())
		return
	}

	_ = h.service.ResendVerification(c.Request.Context(), input.Email)
	shared.OK(c, gin.H{"message": "Verification email sent. Please check your inbox."})
}
