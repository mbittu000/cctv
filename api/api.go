package api

import (
	"cam/api/routes"
	"cam/env"

	"github.com/gofiber/fiber/v2"
)

func API() {
	app := fiber.New()
	app.Static("/static", env.Path)
	app.Get("/days", routes.GetDays)
	app.Get("/files/:day", routes.GetFiles)
	app.Get("/resource", routes.GetResource)
	app.Delete("/delete/:day", routes.DeleteDir)
	app.Listen(":8080")
}
