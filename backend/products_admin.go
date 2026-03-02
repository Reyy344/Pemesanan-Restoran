package main

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type AdminProductResponse struct {
	ID          int    `json:"id"`
	CategoryID  int    `json:"category_id"`
	Category    string `json:"category"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       int    `json:"price"`
	Image       string `json:"image"`
	IsAvailable bool   `json:"is_available"`
	CreatedAt   string `json:"created_at"`
}

type AdminProductPayload struct {
	CategoryID  int    `json:"category_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       int    `json:"price"`
	Image       string `json:"image"`
	IsAvailable bool   `json:"is_available"`
}

type CategoryResponse struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type ToggleAvailabilityPayload struct {
	IsAvailable bool `json:"is_available"`
}

func ensureAdmin(c echo.Context) error {
	role, err := getUserRoleFromToken(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
	}
	if role != "admin" {
		return c.JSON(http.StatusForbidden, map[string]string{"error": "Akses hanya admin"})
	}
	return nil
}

func GetAdminProductsHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	db := OpenDB()
	defer db.Close()

	rows, err := db.Query(`
		SELECT
			p.id, p.category_id, c.name, p.name, p.description, p.price, p.image, p.is_available, p.created_at
		FROM products p
		JOIN categories c ON c.id = p.category_id
		ORDER BY p.created_at DESC
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	res := make([]AdminProductResponse, 0)
	for rows.Next() {
		var p AdminProductResponse
		var desc sql.NullString
		var image sql.NullString
		if err := rows.Scan(
			&p.ID, &p.CategoryID, &p.Category, &p.Name, &desc, &p.Price, &image, &p.IsAvailable, &p.CreatedAt,
		); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		if desc.Valid {
			p.Description = desc.String
		}
		if image.Valid {
			p.Image = image.String
		}
		res = append(res, p)
	}

	return c.JSON(http.StatusOK, res)
}

func GetAdminProductByIDHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID produk tidak valid"})
	}

	db := OpenDB()
	defer db.Close()

	var p AdminProductResponse
	var desc sql.NullString
	var image sql.NullString
	err = db.QueryRow(`
		SELECT
			p.id, p.category_id, c.name, p.name, p.description, p.price, p.image, p.is_available, p.created_at
		FROM products p
		JOIN categories c ON c.id = p.category_id
		WHERE p.id = ?
		LIMIT 1
	`, id).Scan(
		&p.ID, &p.CategoryID, &p.Category, &p.Name, &desc, &p.Price, &image, &p.IsAvailable, &p.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Produk tidak ditemukan"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	if desc.Valid {
		p.Description = desc.String
	}
	if image.Valid {
		p.Image = image.String
	}

	return c.JSON(http.StatusOK, p)
}

func GetAdminCategoriesHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	db := OpenDB()
	defer db.Close()

	rows, err := db.Query("SELECT id, name FROM categories ORDER BY id ASC")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	res := make([]CategoryResponse, 0)
	for rows.Next() {
		var item CategoryResponse
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		res = append(res, item)
	}

	return c.JSON(http.StatusOK, res)
}

func CreateAdminProductHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	req := new(AdminProductPayload)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Payload tidak valid"})
	}
	if req.Name == "" || req.CategoryID <= 0 || req.Price <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nama, kategori, harga wajib valid"})
	}

	db := OpenDB()
	defer db.Close()

	_, err := db.Exec(`
		INSERT INTO products (category_id, name, description, price, image, is_available)
		VALUES (?, ?, ?, ?, ?, ?)
	`, req.CategoryID, req.Name, req.Description, req.Price, req.Image, req.IsAvailable)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, map[string]string{"message": "Produk berhasil ditambah"})
}

func UpdateAdminProductHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID produk tidak valid"})
	}

	req := new(AdminProductPayload)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Payload tidak valid"})
	}
	if req.Name == "" || req.CategoryID <= 0 || req.Price <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Nama, kategori, harga wajib valid"})
	}

	db := OpenDB()
	defer db.Close()

	_, err = db.Exec(`
		UPDATE products
		SET category_id = ?, name = ?, description = ?, price = ?, image = ?, is_available = ?
		WHERE id = ?
	`, req.CategoryID, req.Name, req.Description, req.Price, req.Image, req.IsAvailable, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Produk berhasil diupdate"})
}

func ToggleProductAvailabilityHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID produk tidak valid"})
	}

	req := new(ToggleAvailabilityPayload)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Payload tidak valid"})
	}

	db := OpenDB()
	defer db.Close()

	_, err = db.Exec("UPDATE products SET is_available = ? WHERE id = ?", req.IsAvailable, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Status produk berhasil diubah"})
}

func DeleteAdminProductHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID produk tidak valid"})
	}

	db := OpenDB()
	defer db.Close()

	_, err = db.Exec("DELETE FROM products WHERE id = ?", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Produk berhasil dihapus"})
}
