package recoder

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"time"
	"webcam/env"
	// "github.com/joho/godotenv"
)

func Record() {
	for {
		Work()
	}
}

func Work() {
	// Create context with 60-second timeout
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel() // Always call cancel to free resources

	fname := folder()
	if fname == "" {
		fmt.Println("Failed to create or find folder.")
		return
	}

	filePath := env.Path + "/" + fname + "/" + nameProvider("file") + ".mp4"
	fmt.Println("Recording to:", filePath)

	start := time.Now()
	success := saveFile(ctx, filePath)
	elapsed := time.Since(start)

	if success {
		fmt.Printf("Recording completed and saved to: %s (Duration: %.2f seconds)\n", filePath, elapsed.Seconds())
	} else {
		fmt.Printf("Recording failed or timed out after %.2f seconds, moving to next iteration\n", elapsed.Seconds())
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

func saveFile(ctx context.Context, filepath string) bool {
	// Create command with context for timeout control
	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-rtsp_transport", "tcp",
		"-i", env.Cam,
		"-use_wallclock_as_timestamps", "1",
		"-c:v", "copy",
		"-c:a", "aac",
		"-avoid_negative_ts", "make_zero",
		"-fflags", "+genpts",
		"-fs", "18M",
		"-movflags", "+faststart",
		"-f", "mp4",
		filepath,
	)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	fmt.Println("Starting ffmpeg command with 60-second timeout...")

	// Channel to capture command completion
	done := make(chan error, 1)

	// Start command in goroutine
	go func() {
		done <- cmd.Run()
	}()

	// Wait for either completion or timeout
	select {
	case err := <-done:
		// Command completed
		if err != nil {
			// Check if it was killed due to timeout
			if ctx.Err() == context.DeadlineExceeded {
				fmt.Println("⏰ FFmpeg command timed out after 60 seconds")
				return false
			}
			fmt.Println("❌ Error running ffmpeg command:", err)
			return false
		}
		fmt.Println("✅ FFmpeg command completed successfully")
		return true

	case <-ctx.Done():
		// Context timeout occurred
		fmt.Println("⏰ Recording timed out after 60 seconds, killing ffmpeg process...")

		// Kill the process if it's still running
		if cmd.Process != nil {
			cmd.Process.Kill()
		}

		// Wait a bit for process to be killed
		go func() {
			<-done // Consume the error from the killed process
		}()

		return false
	}
}
