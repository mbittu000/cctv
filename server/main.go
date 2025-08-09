package main

import (
	recoder "webcam/rec"
	"webcam/uploader"
)

func main() {
	// Initialize the uploader
	go uploader.Uploader()
	go recoder.Record()
	select {} // Keep the main goroutine running
}
