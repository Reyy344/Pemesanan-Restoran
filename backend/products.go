package main

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// Pastikan struct Product ini sesuai dengan tabel di DB kamu
type Product struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Price int    `json:"price"`
}

func GetProductsHandler(c echo.Context) error {
	// 1. Panggil fungsi koneksi DB dari db.go [cite: 11]
	db := OpenDB() 
	defer db.Close()

	// 2. Query data (Gunakan logika yang sudah ada di file lama kamu) 
	rows, err := db.Query("SELECT id, name, price FROM products")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}
	defer rows.Close()

	var products []map[string]interface{}
	for rows.Next() {
		var id int
		var name string
		var price int
		rows.Scan(&id, &name, &price)
		products = append(products, map[string]interface{}{
			"id":    id,
			"name":  name,
			"price": price,
		})
	}
	// 3. Kirim sebagai JSON ke React
	return c.JSON(http.StatusOK, products)
}