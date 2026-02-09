package main

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	e := echo.New()

	// Agar React (port 5173) bisa akses Go (port 8080)
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
    AllowOrigins: []string{"http://localhost:5173"}, // Sesuaikan dengan port Vite kamu
    AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
}))

	// Endpoint API untuk React
	e.GET("/api/products", GetProductsHandler)

	e.Logger.Fatal(e.Start(":8080"))
}