package main

import (
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	e := echo.New()

	// Agar React (port 5173) bisa akses Go (port 8080)
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:5173"}, // Sesuaikan dengan port Vite kamu
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization"},
	}))

	// Endpoint API untuk React
	e.GET("/api/products", GetProductsHandler)
	e.GET("/api/tables", GetTablesHandler)
	e.POST("/api/orders/checkout", CheckoutOrderHandler)
	e.POST("/api/tables/:id/cancel", CancelTableBookingHandler)
	e.POST("/login", Login)
	e.POST("/register", Register)

	e.Logger.Fatal(e.Start(":8080"))
}
