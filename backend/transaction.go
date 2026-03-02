package main

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type AdminTransactionsResponse struct {
	Transactions []AdminTransaction `json:"transactions"`
}

func AdminTransactionsHandler(c echo.Context) error {
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

	transactions, err := getAdminTransactions(db)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal mengambil transaksi: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, AdminTransactionsResponse{
		Transactions: transactions,
	})
}
