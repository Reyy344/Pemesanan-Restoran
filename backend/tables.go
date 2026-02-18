package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type ActiveBooking struct {
	OrderID      int    `json:"orderId"`
	UserID       int    `json:"userId"`
	CustomerName string `json:"customerName"`
	GuestCount   int    `json:"guestCount"`
	Status       string `json:"status"`
	CreatedAt    string `json:"createdAt"`
}

type TableResponse struct {
	ID             int            `json:"id"`
	Number         int            `json:"number"`
	Capacity       int            `json:"capacity"`
	Status         string         `json:"status"`
	CurrentBooking *ActiveBooking `json:"currentBooking,omitempty"`
}

func ensureDefaultTables(db *sql.DB) error {
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM meja").Scan(&count); err != nil {
		return err
	}

	if count > 0 {
		return nil
	}

	for i := 1; i <= 6; i++ {
		if _, err := db.Exec(
			"INSERT INTO meja (nomor_meja, kapasitas, status) VALUES (?, ?, 'available')",
			i,
			4,
		); err != nil {
			return err
		}
	}

	return nil
}

func GetTablesHandler(c echo.Context) error {
	db := OpenDB()
	defer db.Close()

	if err := ensureDefaultTables(db); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal menyiapkan data meja: " + err.Error(),
		})
	}

	query := `
		SELECT
			m.id,
			m.nomor_meja,
			m.kapasitas,
			m.status,
			o.id,
			o.user_id,
			o.customer_name,
			o.jumlah_orang,
			o.status,
			o.created_at
		FROM meja m
		LEFT JOIN orders o ON o.id = (
			SELECT o2.id
			FROM orders o2
			WHERE o2.meja_id = m.id
				AND o2.status IN ('pending', 'process', 'paid')
			ORDER BY o2.created_at DESC
			LIMIT 1
		)
		ORDER BY m.nomor_meja ASC
	`

	rows, err := db.Query(query)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal mengambil data meja: " + err.Error(),
		})
	}
	defer rows.Close()

	tables := make([]TableResponse, 0)

	for rows.Next() {
		var table TableResponse
		var bookingID sql.NullInt64
		var bookingUserID sql.NullInt64
		var customerName sql.NullString
		var guestCount sql.NullInt64
		var bookingStatus sql.NullString
		var bookingCreatedAt sql.NullString

		if err := rows.Scan(
			&table.ID,
			&table.Number,
			&table.Capacity,
			&table.Status,
			&bookingID,
			&bookingUserID,
			&customerName,
			&guestCount,
			&bookingStatus,
			&bookingCreatedAt,
		); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Gagal memproses data meja: " + err.Error(),
			})
		}

		if bookingID.Valid {
			table.CurrentBooking = &ActiveBooking{
				OrderID:      int(bookingID.Int64),
				UserID:       int(bookingUserID.Int64),
				CustomerName: customerName.String,
				GuestCount:   int(guestCount.Int64),
				Status:       bookingStatus.String,
				CreatedAt:    bookingCreatedAt.String,
			}
		}

		tables = append(tables, table)
	}

	if err := rows.Err(); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Error saat membaca data meja: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, tables)
}

func CancelTableBookingHandler(c echo.Context) error {
	userID, err := getUserIDFromToken(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
	}

	tableID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "ID meja tidak valid",
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

	var orderID int
	query := `
		SELECT id
		FROM orders
		WHERE meja_id = ?
			AND user_id = ?
			AND status IN ('pending', 'process', 'paid')
		ORDER BY created_at DESC
		LIMIT 1
	`
	if err := tx.QueryRow(query, tableID, userID).Scan(&orderID); err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Booking aktif tidak ditemukan untuk user ini",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal mencari booking: " + err.Error(),
		})
	}

	if _, err := tx.Exec("UPDATE orders SET status = 'failed' WHERE id = ?", orderID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal membatalkan order: " + err.Error(),
		})
	}

	if _, err := tx.Exec("UPDATE meja SET status = 'available' WHERE id = ?", tableID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal memperbarui status meja: " + err.Error(),
		})
	}

	if err := tx.Commit(); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": fmt.Sprintf("Gagal commit transaksi: %v", err),
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message": "Booking meja berhasil dibatalkan",
	})
}
