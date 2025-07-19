package routes

import (
	"cam/env"
	"cam/funcs"
	"os"

	"github.com/gofiber/fiber/v2"
)

func GetDays(c *fiber.Ctx) error {
	dirs, err := os.ReadDir(env.Path)
	if err != nil {
		return err
	}
	var days []string
	for _, dir := range dirs {
		if dir.IsDir() {
			days = append(days, dir.Name())
		}
	}
	return c.JSON(days)
}

func GetFiles(c *fiber.Ctx) error {
	day := c.Params("day")
	files, err := os.ReadDir(env.Path + "/" + day)
	if err != nil {
		return err
	}
	var fileNames []string
	for _, file := range files {
		if !file.IsDir() {
			fileNames = append(fileNames, file.Name())
		}
	}
	return c.JSON(fileNames)
}

func GetResource(c *fiber.Ctx) error {
	size, err := funcs.TotalFileSize(env.Path)
	if err != nil {
		return err
	}
	// convert gb to byte
	var total_storage int64 = 20 * 1024 * 1024 * 1024
	used_storage := size
	available_storage := total_storage - used_storage
	return c.JSON(fiber.Map{
		"total_storage":     total_storage,
		"used_storage":      used_storage,
		"available_storage": available_storage,
	})
}

func DeleteDir(c *fiber.Ctx) error {
	day := c.Params("day")
	err := os.RemoveAll(env.Path + "/" + day)
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{
		"message": "Directory deleted successfully",
	})
}
