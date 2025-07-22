package main

import (
	"cam/api"
	"cam/recoder"
	"fmt"
	"time"
)

func main() {
	fmt.Println("Hello, World!")
	go recoder.Record()
	go api.API()
	time.Sleep(180 * 24 * time.Hour)
}
