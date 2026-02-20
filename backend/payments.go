package main

import (
	"database/sql"
	"net/http"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
)

type SnapTokenRequest struct {
	OrderID int `json:"order_id"`
}

func CreateSnapTokenHandler(c echo.Context) error {
	userID, err := getUserIDFromToken(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
	}

	req := new(SnapTokenRequest)
	if err := c.Bind(req); err != nil || req.OrderID <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "order_id tidak valid"})
	}

	db := OpenDB()
	defer db.Close()

	var ownerUserID int
	err = db.QueryRow("SELECT user_id FROM orders WHERE id = ? LIMIT 1", req.OrderID).Scan(&ownerUserID)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Order tidak ditemukan",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal cek pemilik order: " + err.Error(),
		})
	}

	if ownerUserID != userID {
		return c.JSON(http.StatusForbidden, map[string]string{
			"error": "Order ini milik akun lain. Login pakai akun yang bikin order.",
		})
	}

	var OrderCode string
	var TotalPrice int
	var customerName string

	err = db.QueryRow(`
	SELECT id, order_code, total_price, customer_name
		FROM orders
		WHERE id = ?
		LIMIT 1
		`, req.OrderID).Scan(new(int), &OrderCode, &TotalPrice, &customerName)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error": "Order tidak ditemukan",
			})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal ambil data order: " + err.Error(),
		})
	}

	serverKey := strings.TrimSpace(os.Getenv("MIDTRANS_SERVER_KEY"))
	if serverKey == "" {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "MIDTRANS_SERVER_KEY belum diset di environment",
		})
	}

	var s snap.Client
	s.New(serverKey, midtrans.Sandbox)

	snapReq := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  OrderCode,
			GrossAmt: int64(TotalPrice),
		},
		CustomerDetail: &midtrans.CustomerDetails{
			FName: customerName,
		},
	}

	snapResp, midtransErr := s.CreateTransaction(snapReq)
	if midtransErr != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Gagal create snap token: " + midtransErr.Error(),
		})
	}

	if snapResp == nil || strings.TrimSpace(snapResp.Token) == "" {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Snap token kosong dari Midtrans",
		})
	}

	return c.JSON(http.StatusOK, map[string]any{
		"token":        snapResp.Token,
		"redirect_url": snapResp.RedirectURL,
	})
}
