package main

import (
	"log"
	"net/http"
	"os"
	"time"
	"encoding/json"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"github.com/dgrijalva/jwt-go"
	_ "metting-room-backend/docs"
	"github.com/swaggo/gin-swagger"
	"github.com/swaggo/files"
	"github.com/gin-contrib/cors"
)

type User struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Username string `gorm:"unique" json:"username"`
	Password string `json:"-"`
	Role     string `json:"role"` // admin or user
	Nickname string `json:"nickname"`
}

// SystemSettings 系统设置
type SystemSettings struct {
	ID                    uint `gorm:"primaryKey" json:"id"`
	AllowUserChangePassword bool `json:"allow_user_change_password"` // 是否允许用户修改密码
}

type Room struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Name     string `gorm:"unique" json:"name"`
	Capacity int    `json:"capacity"`
}

type Booking struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	RoomID    uint      `json:"room_id"`
	UserID    uint      `json:"user_id"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

var db *gorm.DB
var jwtKey = []byte("secret_key")

type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	Nickname string `json:"nickname"`
	jwt.StandardClaims
}

// 登录请求体
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// 注册请求体
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// SSO请求体
type SSORequest struct {
	Email    string      `json:"email" binding:"required"`
	Identity interface{} `json:"identity"`
	Role     string      `json:"role"`     // 添加直接支持role字段
	Nickname string      `json:"nickname"`
}

// 添加会议室请求体
type AddRoomRequest struct {
	Name     string `json:"name" binding:"required"`
	Capacity int    `json:"capacity" binding:"required"`
}

// 预订会议室请求体
type BookRoomRequest struct {
	RoomID    uint      `json:"room_id" binding:"required"`
	StartTime time.Time `json:"start_time" binding:"required"`
	EndTime   time.Time `json:"end_time" binding:"required"`
}

// 编辑会议室请求体
type EditRoomRequest struct {
	Name     string `json:"name"`
	Capacity int    `json:"capacity"`
}

// UpdateProfileRequest for updating user's profile
type UpdateProfileRequest struct {
	Nickname string `json:"nickname" binding:"required"`
}

// BookingDetail 包含预订、用户和会议室的详细信息
type BookingDetail struct {
	ID        uint      `json:"id"`
	RoomID    uint      `json:"room_id"`
	UserID    uint      `json:"user_id"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	Username  string    `json:"username"`
	RoomName  string    `json:"room_name"`
}

// 修改密码请求体
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

// 管理员修改用户密码请求体
type AdminChangeUserPasswordRequest struct {
	UserID      uint   `json:"user_id" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

// 更新系统设置请求体
type UpdateSystemSettingsRequest struct {
	AllowUserChangePassword bool `json:"allow_user_change_password"`
}

// @title 会议室预订系统 API
// @version 1.0
// @description 用于会议室管理和预订的后端API
// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
// @BasePath /api

// @Summary 用户登录
// @Description 用户登录，返回JWT
// @Tags 用户
// @Accept json
// @Produce json
// @Param data body LoginRequest true "登录参数"
// @Success 200 {object} map[string]interface{}
// @Router /api/login [post]
func loginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}
	var user User
	if err := db.Where("username = ? AND password = ?", req.Username, req.Password).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}
	// 生成JWT
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		Nickname: user.Nickname,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成token失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": tokenString})
}

// @Summary 用户注册
// @Description 用户注册，返回JWT
// @Tags 用户
// @Accept json
// @Produce json
// @Param data body RegisterRequest true "注册参数"
// @Success 200 {object} map[string]interface{}
// @Router /api/register [post]
func registerHandler(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}
	
	// 验证用户名长度
	if len(req.Username) < 3 || len(req.Username) > 20 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户名长度必须在3-20个字符之间"})
		return
	}
	
	// 验证密码长度
	if len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "密码长度至少6个字符"})
		return
	}
	
	// 检查用户名是否已存在
	var existingUser User
	if err := db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户名已存在"})
		return
	}
	
	// 创建新用户
	user := User{
		Username: req.Username,
		Password: req.Password,
		Role:     "user", // 默认角色为普通用户
		Nickname: req.Username, // 默认昵称和用户名相同
	}
	
	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败"})
		return
	}
	
	// 生成JWT
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		Nickname: user.Nickname,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成token失败"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "注册成功",
		"token":   tokenString,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
			"nickname": user.Nickname,
		},
	})
}

// @Summary 单点登录
// @Description 根据外部信息自动注册或登录用户
// @Tags 用户
// @Accept json
// @Produce json
// @Param data body SSORequest true "SSO参数"
// @Success 200 {object} map[string]interface{}
// @Router /api/auth/sso [post]
func ssoHandler(c *gin.Context) {
	// 兼容扁平结构和data嵌套结构
	var raw map[string]interface{}
	if err := c.ShouldBindJSON(&raw); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}
	var req SSORequest
	if data, ok := raw["data"].(map[string]interface{}); ok {
		b, _ := json.Marshal(data)
		json.Unmarshal(b, &req)
	} else {
		b, _ := json.Marshal(raw)
		json.Unmarshal(b, &req)
	}

	// 解析身份，判断角色（兼容identity为map或数组，以及直接传递的role字段）
	role := "user"
	// 优先使用直接传递的role字段
	if req.Role == "admin" {
		role = "admin"
	} else {
		// 如果没有直接传递role字段，则从identity字段解析
		switch v := req.Identity.(type) {
		case map[string]interface{}:
			if adminVal, ok := v["admin"]; ok {
				if isAdmin, ok := adminVal.(bool); ok && isAdmin {
					role = "admin"
				}
			}
		case []interface{}:
			for _, item := range v {
				if str, ok := item.(string); ok && str == "admin" {
					role = "admin"
					break
				}
			}
		// 新增：identity为[]string类型的情况
		case []string:
			for _, str := range v {
				if str == "admin" {
					role = "admin"
					break
				}
			}
		}
	}
	
	// 打印当前解析到的role，便于调试
	log.Printf("SSO解析到的role: %s", role)

	var user User
	err := db.Where("username = ?", req.Email).First(&user).Error

	// 如果用户不存在，则创建
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			nickname := req.Nickname
			if nickname == "" {
				nickname = req.Email
			}
			newUser := User{
				Username: req.Email,
				Password: req.Email, // 默认使用 email作为密码
				Role:     role,
				Nickname: nickname,
			}
			if err := db.Create(&newUser).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "用户注册失败"})
				return
			}
			user = newUser
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库查询失败"})
			return
		}
	} else {
		// 用户存在，更新昵称
		if req.Nickname != "" && user.Nickname != req.Nickname {
			user.Nickname = req.Nickname
			db.Save(&user)
		}
		// 用户存在，检查角色是否需要同步（无论升级还是降级）
		if user.Role != role {
			user.Role = role
			db.Save(&user)
		}
	}

	// 为用户生成JWT
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		Nickname: user.Nickname,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成token失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": tokenString})
}

// JWT鉴权中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
			c.Abort()
			return
		}
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "token无效或已过期"})
			c.Abort()
			return
		}
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Set("nickname", claims.Nickname)
		c.Next()
	}
}

// 管理员权限中间件
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "无管理员权限"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// @Summary 添加会议室
// @Description 管理员添加会议室
// @Tags 会议室
// @Accept json
// @Produce json
// @Param data body AddRoomRequest true "会议室参数"
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/rooms [post]
func addRoomHandler(c *gin.Context) {
	var req AddRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}
	room := Room{Name: req.Name, Capacity: req.Capacity}
	if err := db.Create(&room).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "会议室已存在或参数错误"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "添加成功", "room": room})
}

// @Summary 查询会议室列表
// @Description 查询所有会议室
// @Tags 会议室
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/rooms [get]
func listRoomsHandler(c *gin.Context) {
	var rooms []Room
	db.Find(&rooms)
	c.JSON(http.StatusOK, gin.H{"rooms": rooms})
}

// @Summary 预订会议室
// @Description 用户预订会议室
// @Tags 预订
// @Accept json
// @Produce json
// @Param data body BookRoomRequest true "预订参数"
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/bookings [post]
func bookRoomHandler(c *gin.Context) {
	var req BookRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}
	// 只校验结束时间必须晚于开始时间
	if !req.EndTime.After(req.StartTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "时间范围不合法"})
		return
	}
	// 检查会议室是否存在
	var room Room
	if err := db.First(&room, req.RoomID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "会议室不存在"})
		return
	}
	// 检查时间冲突
	var count int64
	db.Model(&Booking{}).Where("room_id = ? AND end_time > ? AND start_time < ?", req.RoomID, req.StartTime, req.EndTime).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "该时间段已被预订"})
		return
	}
	val, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "无法获取用户信息"})
		return
	}
	var userID uint
	switch v := val.(type) {
	case float64:
		userID = uint(v)
	case uint:
		userID = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "用户ID格式无效"})
		return
	}
	booking := Booking{
		RoomID:    req.RoomID,
		UserID:    userID,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
	}
	if err := db.Create(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "预订失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "预订成功", "booking": booking})
}

// @Summary 查询所有预订
// @Description 查询所有会议室的预订记录
// @Tags 预订
// @Produce json
// @Param room_id query int false "会议室ID"
// @Param start_time query string false "开始时间(ISO8601)"
// @Param end_time query string false "结束时间(ISO8601)"
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/bookings [get]
func listBookingsHandler(c *gin.Context) {
	roomID := c.Query("room_id")
	start := c.Query("start_time")
	end := c.Query("end_time")

	var bookings []Booking
	query := db
	if roomID != "" {
		query = query.Where("room_id = ?", roomID)
	}
	if start != "" {
		if t, err := time.Parse(time.RFC3339, start); err == nil {
			query = query.Where("end_time > ?", t)
		}
	}
	if end != "" {
		if t, err := time.Parse(time.RFC3339, end); err == nil {
			query = query.Where("start_time < ?", t)
		}
	}
	query.Find(&bookings)
	c.JSON(http.StatusOK, gin.H{"bookings": bookings})
}

// @Summary 取消预订
// @Description 取消指定ID的预订
// @Tags 预订
// @Param id path int true "预订ID"
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/bookings/{id} [delete]
func cancelBookingHandler(c *gin.Context) {
	id := c.Param("id")
	var booking Booking
	if err := db.First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "预订不存在"})
		return
	}
	val, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "无法获取用户信息"})
		return
	}
	var userID uint
	switch v := val.(type) {
	case float64:
		userID = uint(v)
	case uint:
		userID = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "用户ID格式无效"})
		return
	}
	role, _ := c.Get("role")
	if booking.UserID != userID && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "无权限取消该预订"})
		return
	}
	if booking.StartTime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "已开始的预订无法取消"})
		return
	}
	db.Delete(&booking)
	c.JSON(http.StatusOK, gin.H{"message": "取消成功"})
}

// @Summary 查询个人预订
// @Description 查询当前用户的预订记录
// @Tags 预订
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/mybookings [get]
func listMyBookingsHandler(c *gin.Context) {
	val, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "无法获取用户信息"})
		return
	}
	var userID uint
	switch v := val.(type) {
	case float64:
		userID = uint(v)
	case uint:
		userID = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "用户ID格式无效"})
		return
	}
	var bookings []Booking
	db.Where("user_id = ?", userID).Find(&bookings)
	c.JSON(http.StatusOK, gin.H{"bookings": bookings})
}

// @Summary (Admin) 查询所有预订
// @Description 管理员查询所有用户的预订记录
// @Tags 管理员
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/admin/bookings [get]
func listAllBookingsHandler(c *gin.Context) {
	var bookings []Booking
	if err := db.Order("start_time DESC").Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询预订列表失败"})
		return
	}

	var details []BookingDetail
	for _, b := range bookings {
		var user User
		db.First(&user, b.UserID) // 查找预订用户

		var room Room
		db.First(&room, b.RoomID) // 查找会议室

		displayName := user.Nickname
		if displayName == "" {
			displayName = user.Username
		}

		details = append(details, BookingDetail{
			ID:        b.ID,
			RoomID:    b.RoomID,
			UserID:    b.UserID,
			StartTime: b.StartTime,
			EndTime:   b.EndTime,
			Username:  displayName,
			RoomName:  room.Name,
		})
	}

	if details == nil {
		details = make([]BookingDetail, 0)
	}

	c.JSON(http.StatusOK, gin.H{"bookings": details})
}

// @Summary 编辑会议室
// @Description 管理员编辑会议室
// @Tags 会议室
// @Accept json
// @Produce json
// @Param id path int true "会议室ID"
// @Param data body EditRoomRequest true "编辑参数"
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/rooms/{id} [put]
func editRoomHandler(c *gin.Context) {
	id := c.Param("id")
	var room Room
	if err := db.First(&room, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "会议室不存在"})
		return
	}
	var req EditRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}
	if req.Name != "" {
		room.Name = req.Name
	}
	if req.Capacity > 0 {
		room.Capacity = req.Capacity
	}
	db.Save(&room)
	c.JSON(http.StatusOK, gin.H{"message": "编辑成功", "room": room})
}

// @Summary 删除会议室
// @Description 管理员删除会议室
// @Tags 会议室
// @Param id path int true "会议室ID"
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/rooms/{id} [delete]
func deleteRoomHandler(c *gin.Context) {
	id := c.Param("id")
	var room Room
	if err := db.First(&room, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "会议室不存在"})
		return
	}
	db.Delete(&room)
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// @Summary 更新用户信息
// @Description 更新当前用户的昵称
// @Tags 用户
// @Accept json
// @Produce json
// @Param data body UpdateProfileRequest true "更新参数"
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/user/profile [put]
func updateProfileHandler(c *gin.Context) {
	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	val, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "无法获取用户信息"})
		return
	}
	var userID uint
	switch v := val.(type) {
	case float64:
		userID = uint(v)
	case uint:
		userID = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "用户ID格式无效"})
		return
	}

	var user User
	if err := db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户信息已失效，请重新登录"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库查询失败"})
		return
	}

	user.Nickname = req.Nickname
	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}

	// 更新后，签发新token，以确保前端信息同步
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		Nickname: user.Nickname,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成新token失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "更新成功",
		"user": gin.H{
			"user_id":  user.ID,
			"username": user.Username,
			"role":     user.Role,
			"nickname": user.Nickname,
		},
		"token": tokenString,
	})
}

// @Summary 用户修改密码
// @Description 用户修改自己的密码
// @Tags 用户
// @Accept json
// @Produce json
// @Param data body ChangePasswordRequest true "修改密码参数"
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/user/password [put]
func changePasswordHandler(c *gin.Context) {
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	// 验证新密码长度
	if len(req.NewPassword) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "新密码长度至少6个字符"})
		return
	}

	val, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "无法获取用户信息"})
		return
	}
	var userID uint
	switch v := val.(type) {
	case float64:
		userID = uint(v)
	case uint:
		userID = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "用户ID格式无效"})
		return
	}

	var user User
	if err := db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户信息已失效，请重新登录"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库查询失败"})
		return
	}

	// 验证旧密码
	if user.Password != req.OldPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "原密码错误"})
		return
	}

	// 检查系统设置是否允许用户修改密码
	var settings SystemSettings
	if err := db.First(&settings).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 如果没有设置记录，创建默认设置（允许修改密码）
			settings = SystemSettings{AllowUserChangePassword: true}
			db.Create(&settings)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取系统设置失败"})
			return
		}
	}

	if !settings.AllowUserChangePassword {
		c.JSON(http.StatusForbidden, gin.H{"error": "系统已禁用用户修改密码功能"})
		return
	}

	// 更新密码
	user.Password = req.NewPassword
	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "密码更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "密码修改成功"})
}

// @Summary 管理员修改用户密码
// @Description 管理员修改指定用户的密码
// @Tags 管理员
// @Accept json
// @Produce json
// @Param data body AdminChangeUserPasswordRequest true "修改用户密码参数"
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/admin/user/password [put]
func adminChangeUserPasswordHandler(c *gin.Context) {
	var req AdminChangeUserPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	// 验证新密码长度
	if len(req.NewPassword) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "新密码长度至少6个字符"})
		return
	}

	var user User
	if err := db.First(&user, req.UserID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库查询失败"})
		return
	}

	// 更新密码
	user.Password = req.NewPassword
	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "密码更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "用户密码修改成功"})
}

// @Summary 获取系统设置
// @Description 获取系统设置信息
// @Tags 管理员
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/admin/settings [get]
func getSystemSettingsHandler(c *gin.Context) {
	var settings SystemSettings
	if err := db.First(&settings).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 如果没有设置记录，创建默认设置
			settings = SystemSettings{AllowUserChangePassword: true}
			db.Create(&settings)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取系统设置失败"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"settings": settings})
}

// @Summary 更新系统设置
// @Description 管理员更新系统设置
// @Tags 管理员
// @Accept json
// @Produce json
// @Param data body UpdateSystemSettingsRequest true "系统设置参数"
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/admin/settings [put]
func updateSystemSettingsHandler(c *gin.Context) {
	var req UpdateSystemSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	var settings SystemSettings
	if err := db.First(&settings).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 如果没有设置记录，创建新记录
			settings = SystemSettings{ID: 1}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取系统设置失败"})
			return
		}
	}

	settings.AllowUserChangePassword = req.AllowUserChangePassword

	if err := db.Save(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新系统设置失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "系统设置更新成功", "settings": settings})
}

// @Summary 获取所有用户列表
// @Description 管理员获取所有用户列表
// @Tags 管理员
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Security Bearer
// @Router /api/admin/users [get]
func listUsersHandler(c *gin.Context) {
	var users []User
	if err := db.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户列表失败"})
		return
	}

	// 返回用户信息（不包含密码）
	var userList []gin.H
	for _, user := range users {
		userList = append(userList, gin.H{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
			"nickname": user.Nickname,
		})
	}

	c.JSON(http.StatusOK, gin.H{"users": userList})
}

// @Summary 获取系统设置（公共）
// @Description 获取系统设置信息（供普通用户使用）
// @Tags 用户
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/settings [get]
func getPublicSettingsHandler(c *gin.Context) {
	var settings SystemSettings
	if err := db.First(&settings).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 如果没有设置记录，创建默认设置
			settings = SystemSettings{AllowUserChangePassword: true}
			db.Create(&settings)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取系统设置失败"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"settings": settings})
}

func main() {
	var err error
	var dbPath string
	if _, err := os.Stat("/app/data"); err == nil {
		dbPath = "/app/data/meeting_room.db" // 容器环境
	} else {
		dbPath = "data/meeting_room.db" // 本地开发
	}
	db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// 自动迁移表结构
	db.AutoMigrate(&User{}, &Room{}, &Booking{}, &SystemSettings{})

	// 创建默认管理员
	var admin User
	db.Where(User{Username: "admin"}).FirstOrCreate(&admin, User{Username: "admin", Password: "admin", Role: "admin"})

	r := gin.Default()

	// 启用 CORS 跨域中间件，允许所有来源和常用方法
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Token", "Language", "Accept-Language", "X-Forwarded-Proto", "X-Forwarded-Host", "Accept", "Cache-Control", "X-Requested-With", "X-Xsrf-Token"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	r.POST("/api/login", loginHandler)
	r.POST("/api/register", registerHandler)
	r.POST("/api/auth/sso", ssoHandler)
	r.GET("/api/settings", getPublicSettingsHandler)

	auth := r.Group("/api")
	auth.Use(AuthMiddleware())
	{
		auth.GET("/user/info", func(c *gin.Context) {
			userID, _ := c.Get("user_id")
			username, _ := c.Get("username")
			role, _ := c.Get("role")
			nickname, _ := c.Get("nickname")
			
			response := gin.H{
				"user_id":  userID,
				"username": username,
				"role":     role,
				"nickname": nickname,
			}
			
			// 如果是管理员，返回系统设置信息
			if role == "admin" {
				var settings SystemSettings
				if err := db.First(&settings).Error; err != nil {
					if err == gorm.ErrRecordNotFound {
						// 如果没有设置记录，创建默认设置
						settings = SystemSettings{AllowUserChangePassword: true}
						db.Create(&settings)
					}
				}
				response["system_settings"] = settings
			}
			
			c.JSON(http.StatusOK, response)
		})
		// 更新用户信息
		auth.PUT("/user/profile", updateProfileHandler)
		// 查询会议室
		auth.GET("/rooms", listRoomsHandler)
		// 添加会议室（仅管理员）
		auth.POST("/rooms", AdminMiddleware(), addRoomHandler)
		// 预订会议室
		auth.POST("/bookings", bookRoomHandler)
		// 查询预订记录
		auth.GET("/bookings", listBookingsHandler)
		// 查询个人预订
		auth.GET("/mybookings", listMyBookingsHandler)
		// 取消预订
		auth.DELETE("/bookings/:id", cancelBookingHandler)
		// 编辑会议室
		auth.PUT("/rooms/:id", AdminMiddleware(), editRoomHandler)
		// 删除会议室
		auth.DELETE("/rooms/:id", AdminMiddleware(), deleteRoomHandler)
		// (Admin) 查询所有预订记录
		auth.GET("/admin/bookings", AdminMiddleware(), listAllBookingsHandler)
		// 用户修改密码
		auth.PUT("/user/password", changePasswordHandler)
		// 管理员功能
		auth.GET("/admin/users", AdminMiddleware(), listUsersHandler)
		auth.PUT("/admin/user/password", AdminMiddleware(), adminChangeUserPasswordHandler)
		auth.GET("/admin/settings", AdminMiddleware(), getSystemSettingsHandler)
		auth.PUT("/admin/settings", AdminMiddleware(), updateSystemSettingsHandler)
	}

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	r.Run(":80")
} 