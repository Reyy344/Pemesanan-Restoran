package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

type CheckoutItemRequest struct {
	ProductID int `json:"product_id"`
	Quantity  int `json:"quantity"`
}

type CheckoutOrderRequest struct {
	MejaID      int                   `json:"meja_id"`
	JumlahOrang int                   `json:"jumlah_orang"`
	Items       []CheckoutItemRequest `json:"items"`
}

func CheckoutOrderHandler(c echo.Context) error {
	userID, err := getUserIDFromToken(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
	}

	req := new(CheckoutOrderRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Format request tidak valid",
		})
	}

	if req.MejaID <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Meja wajib dipilih",
		})
	}

	if req.JumlahOrang < 1 || req.JumlahOrang > 12 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Jumlah orang harus 1 sampai 12",
		})
	}

	if len(req.Items) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Keranjang kosong",
		})
	}

	db := OpenDB()
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal memulai transaksi",
		})
	}
	defer tx.Rollback()

	var existingTableID int
	err = tx.QueryRow(`
		SELECT meja_id
		FROM orders
		WHERE user_id = ?
			AND status IN ('pending', 'process', 'paid')
		ORDER BY created_at DESC
		LIMIT 1
	`, userID).Scan(&existingTableID)
	if err != nil && err != sql.ErrNoRows {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal validasi booking user",
		})
	}
	if err == nil {
		return c.JSON(http.StatusConflict, map[string]string{
			"error": fmt.Sprintf("Kamu masih punya booking aktif di meja %d", existingTableID),
		})
	}

	result, err := tx.Exec(
		"UPDATE meja SET status = 'occupied' WHERE id = ? AND status = 'available'",
		req.MejaID,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal update status meja: " + err.Error(),
		})
	}

	affectedRows, err := result.RowsAffected()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal memeriksa status meja",
		})
	}
	if affectedRows == 0 {
		return c.JSON(http.StatusConflict, map[string]string{
			"error": "Meja sudah dibooking user lain",
		})
	}

	var customerName string
	if err := tx.QueryRow(
		"SELECT name FROM users WHERE id = ?",
		userID,
	).Scan(&customerName); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal mengambil data user",
		})
	}

	totalPrice := 0
	itemPrices := make(map[int]int)
	for _, item := range req.Items {
		if item.ProductID <= 0 || item.Quantity <= 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Data item tidak valid",
			})
		}

		var price int
		if err := tx.QueryRow(
			"SELECT price FROM products WHERE id = ? AND is_available = 1",
			item.ProductID,
		).Scan(&price); err != nil {
			if err == sql.ErrNoRows {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error": fmt.Sprintf("Produk ID %d tidak tersedia", item.ProductID),
				})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Gagal membaca harga produk",
			})
		}

		itemPrices[item.ProductID] = price
		totalPrice += price * item.Quantity
	}

	orderCode := fmt.Sprintf("ORD-%d-%d", time.Now().UnixNano(), userID)
	insertOrderResult, err := tx.Exec(`
		INSERT INTO orders (
			user_id, order_code, total_price, status, meja_id, customer_name, jumlah_orang
		)
		VALUES (?, ?, ?, 'pending', ?, ?, ?)
	`, userID, orderCode, totalPrice, req.MejaID, customerName, req.JumlahOrang)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal membuat order: " + err.Error(),
		})
	}

	orderID, err := insertOrderResult.LastInsertId()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal mengambil order ID",
		})
	}

	for _, item := range req.Items {
		if _, err := tx.Exec(`
			INSERT INTO order_items (order_id, product_id, quantity, price)
			VALUES (?, ?, ?, ?)
		`, orderID, item.ProductID, item.Quantity, itemPrices[item.ProductID]); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Gagal menyimpan detail order",
			})
		}
	}

	if err := tx.Commit(); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal commit transaksi",
		})
	}

	return c.JSON(http.StatusOK, map[string]any{
		"message":     "Checkout berhasil",
		"order_id":    orderID,
		"order_code":  orderCode,
		"total_price": totalPrice,
	})
}
