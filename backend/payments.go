package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
	"github.com/midtrans/midtrans-go/snap"
)

type SnapTokenRequest struct {
	OrderID int `json:"order_id"`
}

type MidtransNotification struct {
	OrderID           string `json:"order_id"`
	TransactionStatus string `json:"transaction_status"`
	FraudStatus       string `json:"fraud_status"`
	PaymentType       string `json:"payment_type"`
}

func mapMidtransStatus(transactionStatus, fraudStatus string) string {
	if transactionStatus == "settlement" || (transactionStatus == "capture" && fraudStatus == "accept") {
		return "paid"
	}

	if transactionStatus == "deny" || transactionStatus == "cancel" || transactionStatus == "expire" {
		return "failed"
	}

	return "pending"
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
	if s.Options == nil {
		s.Options = &midtrans.ConfigOptions{}
	}
	notificationURL := strings.TrimSpace(os.Getenv("MIDTRANS_NOTIFICATION_URL"))
	if notificationURL != "" {
		s.Options.SetPaymentOverrideNotification(notificationURL)
	}

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

func MidtransNotificationHandler(c echo.Context) error {
	req := new(MidtransNotification)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "payload invalid"})
	}

	orderStatus := mapMidtransStatus(req.TransactionStatus, req.FraudStatus)

	db := OpenDB()
	defer db.Close()

	_, err := db.Exec(`UPDATE orders
		SET status = ?, payment_method = ?
		WHERE order_code = ?
		`, orderStatus, req.PaymentType, req.OrderID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "gagal update order bro!"})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "ok"})
}

func GetOrderStatusHandler(c echo.Context) error {
	userID, err := getUserIDFromToken(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
	}

	orderID := c.Param("id")
	db := OpenDB()
	defer db.Close()

	var status string
	var orderCode string
	err = db.QueryRow(
		"SELECT status, order_code FROM orders WHERE id = ? AND user_id = ? LIMIT 1",
		orderID,
		userID,
	).Scan(&status, &orderCode)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "order tidak ditemukan"})
	}

	// If webhook is delayed/not configured, sync current status directly from Midtrans.
	if status == "pending" || status == "process" {
		serverKey := strings.TrimSpace(os.Getenv("MIDTRANS_SERVER_KEY"))
		if serverKey != "" && orderCode != "" {
			var core coreapi.Client
			core.New(serverKey, midtrans.Sandbox)
			txStatus, midErr := core.CheckTransaction(orderCode)
			if midErr == nil && txStatus != nil {
				newStatus := mapMidtransStatus(txStatus.TransactionStatus, txStatus.FraudStatus)
				if newStatus != status {
					if _, updErr := db.Exec(
						"UPDATE orders SET status = ?, payment_method = ? WHERE id = ?",
						newStatus,
						txStatus.PaymentType,
						orderID,
					); updErr == nil {
						status = newStatus
					}
				}
			} else if midErr != nil {
				fmt.Println("Midtrans status sync warning:", midErr.Error())
			}
		}
	}

	return c.JSON(http.StatusOK, map[string]string{"status": status})
}
