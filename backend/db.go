package main

import (
	"database/sql"

	_ "github.com/go-sql-driver/mysql"
)

func OpenDB() *sql.DB { // Pastikan huruf 'O' besar agar bisa dipanggil file lain 
    db, err := sql.Open("mysql", "root:@tcp(127.0.0.1:3306)/rean_resto")
    if err != nil {
        panic(err)
    }
    return db
}