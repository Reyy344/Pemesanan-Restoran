package main

import (
	"database/sql"

	"github.com/labstack/echo/v4"
)

// Product struct harus sesuai dengan struktur tabel products di database
type Product struct {
	ID          int    `json:"id"`
	CategoryID  int    `json:"category_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       int    `json:"price"`
	Image       string `json:"image"`
	Category	string `json:"category"`
	IsAvailable bool   `json:"is_available"`
	CreatedAt   string `json:"created_at"`
}

func GetProductsHandler(c echo.Context) error {
	// 1. Panggil fungsi koneksi DB dari db.go
	db := OpenDB()
	defer db.Close()

	// 2. Query data dari tabel products
	query := `
		SELECT 
    		p.id,
    		p.category_id,
    		p.name,
    		p.description,
    		p.price,
    		p.image,	
    		c.name as category,
    		p.is_available,
    		p.created_at
		FROM products p
		JOIN categories c ON p.category_id = c.id
		WHERE p.is_available = 1
		ORDER BY p.created_at DESC
	`

	rows, err := db.Query(query)
	if err != nil {
		return c.JSON(500, map[string]string{
			"error": "Gagal mengambil data produk: " + err.Error(),
		})
	}
	defer rows.Close()

	// 3. Konversi hasil query ke slice of Product
	var products []Product
	for rows.Next() {
		var p Product
		var description sql.NullString
		var image sql.NullString
		err := rows.Scan(
			&p.ID,
			&p.CategoryID,
			&p.Name,
			&description,
			&p.Price,
			&image,
			&p.Category,
			&p.IsAvailable,
			&p.CreatedAt,
		)
		if err != nil {
			return c.JSON(500, map[string]string{
				"error": "Gagal memproses data produk: " + err.Error(),
			})
		}
		
		// Konversi sql.NullString ke string
		var descriptionStr, imageStr string
		if description.Valid {
			descriptionStr = description.String
		}
		if image.Valid {
			imageStr = image.String
		}
		
		// Buat produk dengan nilai string yang valid
		p.Description = descriptionStr
		p.Image = imageStr

	products = append(products, p)
	}

	// 4. Handle error dari rows.Next()
	if err = rows.Err(); err != nil {
		return c.JSON(500, map[string]string{
			"error": "Error saat iterasi data: " + err.Error(),
		})
	}

	// 5. Return JSON response
	return c.JSON(200, products)
}
