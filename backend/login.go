package main

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID 			int
	Email 	 	string
	Password 	string
	Role 		string
	Username	string
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Email 	 string `json:"email"`
	Username string `json:"name"`
	Password string `json:"password"`
}

func Login(c echo.Context) error {
	db := OpenDB()
	defer db.Close()

	req := new(LoginRequest)

	if err := c.Bind(req); err != nil {
		return c.JSON(400, "Bad Request")
	}

	var user User 

	err := db.QueryRow(
		"SELECT id, email, password, role, name FROM users WHERE email = ?",
		req.Email,
	).Scan(&user.ID, &user.Email, &user.Password, &user.Role, &user.Username)

	if err != nil {
		return c.JSON(404, "User tidak ditemukan")
	}

	err = bcrypt.CompareHashAndPassword(
        []byte(user.Password),
        []byte(req.Password),
    )

	 if err != nil {
        return c.JSON(401, "Password salah")
    }

    // buat JWT
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "user_id": user.ID,
        "email":   user.Email,
		"role":	   user.Role,
        "exp":     time.Now().Add(time.Hour * 24).Unix(),
    })

    t, _ := token.SignedString([]byte("SECRET_KEY"))

    return c.JSON(200, map[string]string{
        "token": t,
		"role": user.Role,
		"username": user.Username,
    })	
}

func Register(c echo.Context) error {
	
	db := OpenDB()
	defer db.Close()

	req := new(RegisterRequest)
	c.Bind(req)
	
	hashedPassword, _ := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)

	_, err := db.Exec(
		"INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
		req.Username,
		req.Email,
		hashedPassword,
	)

	if err != nil {
		return c.JSON(500, "Gagal Daftar!")
	}

	return c.JSON(200, "Register Berhasil")
}