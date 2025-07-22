package recoder

import (
	"cam/env"
	"context"
	"fmt"
	"os"
	"os/exec"
	"time"
)

func Record() {
	for {
		Work()
	}
}

func Work() {
	fname := folder()
	if fname == "" {
		fmt.Println("Failed to create or find folder.")
		return
	}

	filePath := env.Path + "/" + fname + "/" + nameProvider("file") + ".mp4"
	fmt.Println("Recording to:", filePath)

	success := saveFile(filePath)
	if success {
		fmt.Println("Recording completed and saved to:", filePath)
	} else {
		fmt.Println("Recording failed.")
	}
}

func folder() string {
	dir, err := os.ReadDir(env.Path)
	if err != nil {
		fmt.Println("Error reading directory:", err)
		return ""
	}

	folderName := nameProvider("folder")

	found := false
	for _, file := range dir {
		if file.IsDir() && file.Name() == folderName {
			found = true
			break
		}
	}

	if !found {
		folderCreate(folderName)
	}

	return folderName
}

func folderCreate(name string) {
	path := env.Path + "/" + name
	err := os.Mkdir(path, 0755)
	if err != nil {
		fmt.Println("Error creating directory:", err)
		return
	}
	fmt.Println("Directory created successfully:", path)
}

func nameProvider(types string) string {
	times := time.Now().In(time.FixedZone("Asia/Kolkata", 5*60*60+30*60))
	yy := times.Year()
	mm := times.Month()
	dd := times.Day()
	hh := times.Hour()
	min := times.Minute()
	ss := times.Second()

	if types == "folder" {
		return fmt.Sprintf("%d-%02d-%02d", yy, mm, dd)
	}
	return fmt.Sprintf("%02d-%02d-%02d", hh, min, ss)
}

func saveFile(filepath string) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 61*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx,
		"ffmpeg",
		"-rtsp_transport", "tcp",
		"-i", "rtsp://192.168.0.104:5543/live/channel0",
		"-map", "0",
		"-c:v", "copy",
		"-c:a", "aac",
		"-f", "mp4", // ensure MP4 container format
		filepath,
	)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	fmt.Println("Starting ffmpeg command...")
	start := time.Now()
	err := cmd.Run()
	elapsed := time.Since(start)

	if ctx.Err() == context.DeadlineExceeded {
		fmt.Println("FFmpeg forcibly stopped after timeout")
		return true
	}

	if err != nil {
		fmt.Println("Error running ffmpeg command:", err)
		return false
	}

	if elapsed < 55*time.Second {
		fmt.Println("Warning: ffmpeg exited too early:", elapsed)
		return false
	}

	return true
}
