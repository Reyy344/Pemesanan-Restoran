package main

import (
	"errors"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

func parseTokenClaims(c echo.Context) (jwt.MapClaims, error) {
	authHeader := c.Request().Header.Get("Authorization")
	if authHeader == "" {
		return nil, errors.New("missing authorization header")
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return nil, errors.New("invalid authorization format")
	}

	tokenString := parts[1]
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte("SECRET_KEY"), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}

func getUserIDFromToken(c echo.Context) (int, error) {
	claims, err := parseTokenClaims(c)
	if err != nil {
		return 0, err
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

func getUserRoleFromToken(c echo.Context) (string, error) {
	claims, err := parseTokenClaims(c)
	if err != nil {
		return "", err
	}

	roleRaw, ok := claims["role"]
	if !ok {
		return "", errors.New("role missing in token")
	}

	role, ok := roleRaw.(string)
	if !ok || strings.TrimSpace(role) == "" {
		return "", errors.New("invalid role in token")
	}

	return role, nil
}
