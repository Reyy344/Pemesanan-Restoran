package main

import (
	"log"
	"strings"

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
		AllowOriginFunc: func(origin string) (bool, error) {
			if origin == "" {
				return true, nil
			}

			if strings.HasPrefix(origin, "http://localhost:") ||
				strings.HasPrefix(origin, "http://127.0.0.1:") ||
				strings.HasPrefix(origin, "https://localhost:") ||
				strings.HasPrefix(origin, "https://127.0.0.1:") {
				return true, nil
			}

			if strings.HasPrefix(origin, "https://") && strings.HasSuffix(origin, ".devtunnels.ms") {
				return true, nil
			}

			return false, nil
		},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization"},
	}))

	// Endpoint API untuk React
	e.GET("/api/products", GetProductsHandler)
	e.GET("/api/tables", GetTablesHandler)
	e.GET("/api/orders/:id", GetOrderDetailHandler)
	e.GET("/api/orders/by-code/:code", GetOrderDetailByCodeHandler)
	e.GET("/api/orders/:id/status", GetOrderStatusHandler)
	e.GET("/api/admin/orders/:id", GetAdminOrderDetailHandler)
	e.GET("/api/admin/dashboard", AdminDashboardHandler)
	e.GET("/api/admin/transactions", AdminTransactionsHandler)
	e.GET("/api/admin/accounts", GetAdminAccountsHandler)
	e.PATCH("/api/admin/accounts/:id/role", UpdateAdminAccountRoleHandler)
	e.DELETE("/api/admin/accounts/:id", DeleteAdminAccountHandler)
	e.POST("/api/payments/notification", MidtransNotificationHandler)
	e.POST("/api/payments/snap-token", CreateSnapTokenHandler)
	e.POST("/api/orders/checkout", CheckoutOrderHandler)
	e.POST("/api/tables/:id/cancel", CancelTableBookingHandler)
	e.GET("/api/admin/tables", GetAdminTablesHandler)
	e.GET("/api/admin/tables/:id", GetAdminTableByIDHandler)
	e.POST("/api/admin/tables", CreateAdminTableHandler)
	e.PUT("/api/admin/tables/:id", UpdateAdminTableHandler)
	e.PATCH("/api/admin/tables/:id/approve", ApproveTableBookingHandler)
	e.PATCH("/api/admin/tables/:id/complete", CompleteTableOrderHandler)
	e.DELETE("/api/admin/tables/:id", DeleteAdminTableHandler)
	e.GET("/api/admin/categories", GetAdminCategoriesHandler)
	e.GET("/api/admin/products", GetAdminProductsHandler)
	e.GET("/api/admin/products/:id", GetAdminProductByIDHandler)
	e.POST("/api/admin/products", CreateAdminProductHandler)
	e.PUT("/api/admin/products/:id", UpdateAdminProductHandler)
	e.PATCH("/api/admin/products/:id/availability", ToggleProductAvailabilityHandler)
	e.DELETE("/api/admin/products/:id", DeleteAdminProductHandler)
	e.POST("/login", Login)
	e.POST("/register", Register)

	e.Logger.Fatal(e.Start(":8080"))
}
