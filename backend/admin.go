package main

import (
	"database/sql"
	"net/http"

	"github.com/labstack/echo/v4"
)

type AdminSummary struct {
	TotalRevenue    int `json:"totalRevenue"`
	TotalOrders     int `json:"totalOrders"`
	AvailableTables int `json:"availableTables"`
	OccupiedTables  int `json:"occupiedTables"`
}

type AdminTransaction struct {
	OrderID      int    `json:"orderId"`
	CustomerName string `json:"customerName"`
	TotalProduct int    `json:"totalProduct"`
	TotalPrice   int    `json:"totalPrice"`
	Date         string `json:"date"`
	Status       string `json:"status"`
}

type AdminDashboardResponse struct {
	Summary      AdminSummary       `json:"summary"`
	Transactions []AdminTransaction `json:"transactions"`
}

func getAdminTransactions(db *sql.DB) ([]AdminTransaction, error) {
	rows, err := db.Query(`
		SELECT
			o.id,
			COALESCE(u.name, o.customer_name) AS customer_name,
			COALESCE(SUM(oi.quantity), 0) AS total_product,
			o.total_price,
			DATE_FORMAT(o.created_at, '%d-%m-%Y') AS created_date,
			o.status
		FROM orders o
		LEFT JOIN users u ON u.id = o.user_id
		LEFT JOIN order_items oi ON oi.order_id = o.id
		GROUP BY o.id, u.name, o.customer_name, o.total_price, o.created_at, o.status
		ORDER BY o.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions := make([]AdminTransaction, 0)
	for rows.Next() {
		var tx AdminTransaction
		var createdAt string

		if err := rows.Scan(
			&tx.OrderID,
			&tx.CustomerName,
			&tx.TotalProduct,
			&tx.TotalPrice,
			&createdAt,
			&tx.Status,
		); err != nil {
			return nil, err
		}

		tx.Date = createdAt
		transactions = append(transactions, tx)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}

func AdminDashboardHandler(c echo.Context) error {
	role, err := getUserRoleFromToken(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
	}
	if role != "admin" {
		return c.JSON(http.StatusForbidden, map[string]string{
			"error": "Akses ditolak",
		})
	}

	db := OpenDB()
	defer db.Close()

	if err := ensureDefaultTables(db); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal menyiapkan data meja: " + err.Error(),
		})
	}

	var summary AdminSummary

	if err := db.QueryRow(`
		SELECT COALESCE(SUM(total_price), 0)
		FROM orders
		WHERE status = 'paid'
	`).Scan(&summary.TotalRevenue); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal menghitung total pendapatan: " + err.Error(),
		})
	}

	if err := db.QueryRow(`
		SELECT COUNT(*)
		FROM orders
	`).Scan(&summary.TotalOrders); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal menghitung total order: " + err.Error(),
		})
	}

	if err := db.QueryRow(`
		SELECT
			COALESCE(SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END), 0)
		FROM meja
	`).Scan(&summary.AvailableTables, &summary.OccupiedTables); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal menghitung status meja: " + err.Error(),
		})
	}

	transactions, err := getAdminTransactions(db)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal mengambil transaksi: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, AdminDashboardResponse{
		Summary:      summary,
		Transactions: transactions,
	})
}
