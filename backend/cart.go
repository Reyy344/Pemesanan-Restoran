package main

import (
	"html/template"
	"net/http"
)

func cartHandler(w http.ResponseWriter) {
	tmpl, err := template.ParseFiles("views/carts.html")
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	tmpl.Execute(w, nil)
}