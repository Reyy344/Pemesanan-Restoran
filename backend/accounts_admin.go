package main

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
)

type AdminAccountResponse struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type AdminAccountsListResponse struct {
	Accounts []AdminAccountResponse `json:"accounts"`
}

type AdminRoleUpdateRequest struct {
	Role string `json:"role"`
}

func GetAdminAccountsHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	db := OpenDB()
	defer db.Close()

	rows, err := db.Query(`
		SELECT id, COALESCE(name, ''), email, role
		FROM users
		ORDER BY id DESC
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	accounts := make([]AdminAccountResponse, 0)
	for rows.Next() {
		var item AdminAccountResponse
		if err := rows.Scan(&item.ID, &item.Name, &item.Email, &item.Role); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		accounts = append(accounts, item)
	}

	if err := rows.Err(); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, AdminAccountsListResponse{Accounts: accounts})
}

func UpdateAdminAccountRoleHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID akun tidak valid"})
	}

	req := new(AdminRoleUpdateRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Payload tidak valid"})
	}

	nextRole := strings.ToLower(strings.TrimSpace(req.Role))
	if nextRole != "admin" && nextRole != "user" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Role hanya boleh admin atau user"})
	}

	currentUserID, err := getUserIDFromToken(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
	}
	if id == currentUserID && nextRole != "admin" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Tidak bisa menurunkan role akun sendiri"})
	}

	db := OpenDB()
	defer db.Close()

	var currentRole string
	err = db.QueryRow("SELECT role FROM users WHERE id = ?", id).Scan(&currentRole)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Akun tidak ditemukan"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	currentRole = strings.ToLower(strings.TrimSpace(currentRole))
	if currentRole == nextRole {
		return c.JSON(http.StatusOK, map[string]string{"message": "Role akun sudah sesuai"})
	}

	if currentRole == "admin" && nextRole == "user" {
		var otherAdminCount int
		if err := db.QueryRow(
			"SELECT COUNT(*) FROM users WHERE role = 'admin' AND id <> ?",
			id,
		).Scan(&otherAdminCount); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		if otherAdminCount == 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Minimal harus ada 1 admin"})
		}
	}

	if _, err := db.Exec("UPDATE users SET role = ? WHERE id = ?", nextRole, id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Role akun berhasil diubah"})
}

func DeleteAdminAccountHandler(c echo.Context) error {
	if err := ensureAdmin(c); err != nil {
		return err
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID akun tidak valid"})
	}

	currentUserID, err := getUserIDFromToken(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
	}
	if id == currentUserID {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Tidak bisa menghapus akun sendiri"})
	}

	db := OpenDB()
	defer db.Close()

	var currentRole string
	err = db.QueryRow("SELECT role FROM users WHERE id = ?", id).Scan(&currentRole)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Akun tidak ditemukan"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	currentRole = strings.ToLower(strings.TrimSpace(currentRole))
	if currentRole == "admin" {
		var otherAdminCount int
		if err := db.QueryRow(
			"SELECT COUNT(*) FROM users WHERE role = 'admin' AND id <> ?",
			id,
		).Scan(&otherAdminCount); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		if otherAdminCount == 0 {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Minimal harus ada 1 admin"})
		}
	}

	if _, err := db.Exec("DELETE FROM users WHERE id = ?", id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Akun berhasil dihapus"})
}
