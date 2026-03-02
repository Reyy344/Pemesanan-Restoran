package main

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type AdminTableBooking struct {
	OrderID      int    `json:"orderId"`
	UserID       int    `json:"userId"`
	CustomerName string `json:"customerName"`
	GuestCount   int    `json:"guestCount"`
	Status       string `json:"status"`
	CreatedAt    string `json:"createdAt"`
	TotalItems   int    `json:"totalItems"`
	TotalPrice   int    `json:"totalPrice"`
}

type AdminTableItem struct {
	ID             int                `json:"id"`
	Number         int                `json:"number"`
	Capacity       int                `json:"capacity"`
	Status         string             `json:"status"`
	CurrentBooking *AdminTableBooking `json:"currentBooking,omitempty"`
}

type AdminOrderItem struct {
	ProductName string `json:"product_name"`
	Quantity    int    `json:"quantity"`
	Price       int    `json:"price"`
	Subtotal    int    `json:"subtotal"`
	Image       string `json:"image"`
}

type AdminOrderDetailResponse struct {
	OrderID      int              `json:"order_id"`
	OrderCode    string           `json:"order_code"`
	MejaID       int              `json:"meja_id"`
	MejaNumber   int              `json:"meja_number"`
	CustomerName string           `json:"customer_name"`
	JumlahOrang  int              `json:"jumlah_orang"`
	Status       string           `json:"status"`
	TotalPrice   int              `json:"total_price"`
	Items        []AdminOrderItem `json:"items"`
}

type AdminTableUpsertRequest struct {
	Number   int `json:"number"`
	Capacity int `json:"capacity"`
}

func GetAdminTablesHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	db := OpenDB()
	defer db.Close()

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
			o.created_at,
			IFNULL(oi.total_items, 0) AS total_items,
			IFNULL(o.total_price, 0) AS total_price
		FROM meja m
		LEFT JOIN orders o ON o.id = (
			SELECT o2.id
			FROM orders o2
			WHERE o2.meja_id = m.id
				AND o2.status IN ('pending', 'process', 'paid')
			ORDER BY o2.created_at DESC
			LIMIT 1
		)
		LEFT JOIN (
			SELECT order_id, SUM(quantity) AS total_items
			FROM order_items
			GROUP BY order_id
		) oi ON oi.order_id = o.id
		ORDER BY m.nomor_meja ASC
	`

	rows, err := db.Query(query)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal mengambil data meja: " + err.Error(),
		})
	}
	defer rows.Close()

	tables := make([]AdminTableItem, 0)
	for rows.Next() {
		var table AdminTableItem
		var bookingID sql.NullInt64
		var bookingUserID sql.NullInt64
		var customerName sql.NullString
		var guestCount sql.NullInt64
		var bookingStatus sql.NullString
		var bookingCreatedAt sql.NullString
		var totalItems sql.NullInt64
		var totalPrice sql.NullInt64

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
			&totalItems,
			&totalPrice,
		); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Gagal memproses data meja: " + err.Error(),
			})
		}

		if bookingID.Valid {
			table.CurrentBooking = &AdminTableBooking{
				OrderID:      int(bookingID.Int64),
				UserID:       int(bookingUserID.Int64),
				CustomerName: customerName.String,
				GuestCount:   int(guestCount.Int64),
				Status:       bookingStatus.String,
				CreatedAt:    bookingCreatedAt.String,
				TotalItems:   int(totalItems.Int64),
				TotalPrice:   int(totalPrice.Int64),
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

func GetAdminTableByIDHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID meja tidak valid"})
	}

	db := OpenDB()
	defer db.Close()

	var table AdminTableItem
	err = db.QueryRow(`
		SELECT id, nomor_meja, kapasitas, status
		FROM meja
		WHERE id = ?
		LIMIT 1
	`, id).Scan(&table.ID, &table.Number, &table.Capacity, &table.Status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Meja tidak ditemukan"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal mengambil data meja"})
	}

	return c.JSON(http.StatusOK, table)
}

func CreateAdminTableHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	req := new(AdminTableUpsertRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Payload tidak valid"})
	}
	if req.Number <= 0 || req.Capacity <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nomor meja dan kapasitas wajib lebih dari 0"})
	}

	db := OpenDB()
	defer db.Close()

	_, err := db.Exec(`
		INSERT INTO meja (nomor_meja, kapasitas, status)
		VALUES (?, ?, 'available')
	`, req.Number, req.Capacity)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal menambah meja: " + err.Error()})
	}

	return c.JSON(http.StatusCreated, map[string]string{"message": "Meja berhasil ditambahkan"})
}

func UpdateAdminTableHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID meja tidak valid"})
	}

	req := new(AdminTableUpsertRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Payload tidak valid"})
	}
	if req.Number <= 0 || req.Capacity <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nomor meja dan kapasitas wajib lebih dari 0"})
	}

	db := OpenDB()
	defer db.Close()

	_, err = db.Exec(`
		UPDATE meja
		SET nomor_meja = ?, kapasitas = ?
		WHERE id = ?
	`, req.Number, req.Capacity, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal update meja: " + err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Meja berhasil diupdate"})
}

func DeleteAdminTableHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID meja tidak valid"})
	}

	db := OpenDB()
	defer db.Close()

	var active int
	if err := db.QueryRow(`
		SELECT COUNT(*)
		FROM orders
		WHERE meja_id = ?
			AND status IN ('pending', 'process', 'paid')
	`, id).Scan(&active); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal validasi meja"})
	}
	if active > 0 {
		return c.JSON(http.StatusConflict, map[string]string{"error": "Meja sedang dipakai, tidak bisa dihapus"})
	}

	if _, err := db.Exec("DELETE FROM meja WHERE id = ?", id); err != nil {
		return c.JSON(http.StatusConflict, map[string]string{
			"error": "Meja tidak bisa dihapus karena sudah punya riwayat order",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Meja berhasil dihapus"})
}

func ApproveTableBookingHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	tableID, err := strconv.Atoi(c.Param("id"))
	if err != nil || tableID <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID meja tidak valid"})
	}

	db := OpenDB()
	defer db.Close()

	result, err := db.Exec(`
		UPDATE orders
		SET status = 'process'
		WHERE id = (
			SELECT id FROM (
				SELECT id
				FROM orders
				WHERE meja_id = ?
					AND status = 'pending'
				ORDER BY created_at DESC
				LIMIT 1
			) x
		)
	`, tableID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal menyetujui booking"})
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		return c.JSON(http.StatusConflict, map[string]string{"error": "Tidak ada booking pending untuk meja ini"})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Booking meja disetujui"})
}

func CompleteTableOrderHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	tableID, err := strconv.Atoi(c.Param("id"))
	if err != nil || tableID <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID meja tidak valid"})
	}

	db := OpenDB()
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal memulai transaksi"})
	}
	defer tx.Rollback()

	result, err := tx.Exec(`
		UPDATE orders
		SET status = 'done'
		WHERE id = (
			SELECT id FROM (
				SELECT id
				FROM orders
				WHERE meja_id = ?
					AND status IN ('pending', 'process', 'paid')
				ORDER BY created_at DESC
				LIMIT 1
			) x
		)
	`, tableID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal menyelesaikan pesanan"})
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		return c.JSON(http.StatusConflict, map[string]string{"error": "Tidak ada pesanan aktif di meja ini"})
	}

	if _, err := tx.Exec("UPDATE meja SET status = 'available' WHERE id = ?", tableID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal mengosongkan meja"})
	}

	if err := tx.Commit(); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal commit transaksi"})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Pesanan selesai, meja kembali tersedia"})
}

func GetAdminOrderDetailHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	orderID, err := strconv.Atoi(c.Param("id"))
	if err != nil || orderID <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID order tidak valid"})
	}

	db := OpenDB()
	defer db.Close()

	var res AdminOrderDetailResponse
	err = db.QueryRow(`
		SELECT
			o.id, o.order_code, o.meja_id, m.nomor_meja,
			o.customer_name, o.jumlah_orang, o.status, o.total_price
		FROM orders o
		JOIN meja m ON m.id = o.meja_id
		WHERE o.id = ?
		LIMIT 1
	`, orderID).Scan(
		&res.OrderID,
		&res.OrderCode,
		&res.MejaID,
		&res.MejaNumber,
		&res.CustomerName,
		&res.JumlahOrang,
		&res.Status,
		&res.TotalPrice,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Order tidak ditemukan"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal ambil detail order"})
	}

	rows, err := db.Query(`
		SELECT p.name, oi.quantity, oi.price, (oi.quantity * oi.price) AS subtotal, IFNULL(p.image, '')
		FROM order_items oi
		JOIN products p ON p.id = oi.product_id
		WHERE oi.order_id = ?
	`, orderID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal ambil item order"})
	}
	defer rows.Close()

	items := make([]AdminOrderItem, 0)
	for rows.Next() {
		var item AdminOrderItem
		if err := rows.Scan(&item.ProductName, &item.Quantity, &item.Price, &item.Subtotal, &item.Image); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Gagal baca item order"})
		}
		items = append(items, item)
	}
	res.Items = items

	return c.JSON(http.StatusOK, res)
}
