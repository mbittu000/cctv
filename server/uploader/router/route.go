package router

import (
	"fmt"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
)

func GetDays(c *fiber.Ctx) error {
	dir, err := os.ReadDir("./public")
	if err != nil {
		return c.JSON(fiber.Map{"error": "Unable to read directory"})
	}
	var days []string
	for _, d := range dir {
		if d.IsDir() {
			days = append(days, d.Name())
		}
	}
	current := time.Now().Format("2006-01-02")
	return c.JSON(fiber.Map{"dates": days, "current": current})
}

func GetVideos(c *fiber.Ctx) error {
	date := c.Query("date")
	vids, err := os.ReadDir("./public/" + date)
	if err != nil {
		return c.JSON(fiber.Map{"error": "Unable to read videos for the date"})
	}
	var videos []string
	for _, vid := range vids {
		if !vid.IsDir() {
			videos = append(videos, vid.Name())
		}
	}
	return c.JSON(fiber.Map{"videos": videos, "date": date})
}

func GetDirStats(c *fiber.Ctx) error {
	date := c.Query("date")
	total := 0
	dirs, err := os.ReadDir("./public/" + date)
	if err != nil {
		return c.JSON(fiber.Map{"error": "Unable to read directory"})
	}
	for _, dir := range dirs {
		if !dir.IsDir() {
			stat, err := os.Stat("./public/" + date + "/" + dir.Name())
			if err != nil {
				return c.JSON(fiber.Map{"error": fmt.Sprintf("Unable to get stats for %s", dir.Name())})
			}
			total += int(stat.Size())
		}
	}
	return c.JSON(fiber.Map{"total": total})
}

func GetVideoStats(c *fiber.Ctx) error {
	date := c.Query("date")
	id := c.Query("id")
	stat, err := os.Stat("./public/" + date + "/" + id)
	if err != nil {
		return c.JSON(fiber.Map{"error": "Unable to get video stats"})
	}
	if stat.IsDir() {
		return c.JSON(fiber.Map{"error": "Provided id is not a video"})
	}
	// Logic to get video stats for the specific id
	return c.JSON(fiber.Map{"id": id, "size": stat.Size(), "mode": stat.Mode(), "modTime": stat.ModTime()})
}

func DeleteDate(c *fiber.Ctx) error {
	date := c.Query("date")
	err := os.RemoveAll("./public/" + date)
	if err != nil {
		return c.JSON(fiber.Map{"error": "Unable to delete date"})
	}
	return c.JSON(fiber.Map{"message": "Date deleted successfully"})
}
