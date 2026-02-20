package main

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Info: file .env backend tidak ditemukan, pakai environment sistem")
	}

	e := echo.New()

	// Agar React (port 5173) bisa akses Go (port 8080)
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:5174",
			"http://127.0.0.1:5174",
		}, // Support variasi host/port Vite dev server
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization"},
	}))

	// Endpoint API untuk React
	e.GET("/api/products", GetProductsHandler)
	e.GET("/api/tables", GetTablesHandler)
	e.GET("/api/orders/:id", GetOrderDetailHandler)
	e.POST("/api/payments/snap-token", CreateSnapTokenHandler)
	e.POST("/api/orders/checkout", CheckoutOrderHandler)
	e.POST("/api/tables/:id/cancel", CancelTableBookingHandler)
	e.POST("/login", Login)
	e.POST("/register", Register)

	e.Logger.Fatal(e.Start(":8080"))
}
