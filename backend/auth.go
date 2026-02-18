package main

import (
	"errors"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

func getUserIDFromToken(c echo.Context) (int, error) {
	authHeader := c.Request().Header.Get("Authorization")
	if authHeader == "" {
		return 0, errors.New("missing authorization header")
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return 0, errors.New("invalid authorization format")
	}

	tokenString := parts[1]
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte("SECRET_KEY"), nil
	})
	if err != nil || !token.Valid {
		return 0, errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, errors.New("invalid token claims")
	}

	userIDRaw, ok := claims["user_id"]
	if !ok {
		return 0, errors.New("user_id missing in token")
	}

	userIDFloat, ok := userIDRaw.(float64)
	if !ok {
		return 0, errors.New("invalid user_id in token")
	}

	return int(userIDFloat), nil
}
