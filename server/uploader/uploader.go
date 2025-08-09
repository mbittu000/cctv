package uploader

import (
	"webcam/uploader/router"

	"github.com/gofiber/fiber/v2"
)

func Uploader() {
	app := fiber.New()

	// static files
	app.Static("/static", "./public")
	// get all
	app.Get("/getDates", router.GetDays)
	app.Get("/getVideos", router.GetVideos)
	// // get specific
	app.Get("/getDirStats", router.GetDirStats)
	app.Get("/getVideoStats", router.GetVideoStats)
	// delete date
	app.Delete("/deleteDate", router.DeleteDate)

	app.Listen(":8080")
}
