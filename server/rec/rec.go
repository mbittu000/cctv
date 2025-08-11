package recoder

import (
	"fmt"
	"net"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"webcam/env"
)

// Record runs the recording loop forever
func Record() {
	for {
		Work()
		// small pause to avoid busy-looping on persistent failures
		time.Sleep(500 * time.Millisecond)
	}
}

// Work records a single 60-second video if the RTSP stream is reachable
func Work() {
	// quick reachability check (TCP connect to host:port)
	if !isRTSPReachable(env.Cam, 5*time.Second) {
		fmt.Println("⚠️ RTSP not reachable — retrying in 5s")
		time.Sleep(5 * time.Second)
		return
	}

	// create/find folder only after stream check
	fname := folder()
	if fname == "" {
		fmt.Println("❌ Failed to create or find folder.")
		return
	}

	// prepare filepath
	dirPath := filepath.Join(env.Path, fname)
	filePath := filepath.Join(dirPath, nameProvider("file")+".mp4")
	fmt.Println("🎥 Recording to:", filePath)

	// build ffmpeg command — record exactly 60 seconds so ffmpeg closes file cleanly
	cmd := exec.Command(
		"ffmpeg",
		"-rtsp_transport", "tcp",
		"-i", env.Cam,
		"-use_wallclock_as_timestamps", "1",
		"-c:v", "copy",
		"-c:a", "aac",
		"-avoid_negative_ts", "make_zero",
		"-fflags", "+genpts",
		"-fs", "18M",
		"-movflags", "+faststart",
		"-t", "60", // exact recording duration
		"-y", // overwrite existing files
		filePath,
	)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	start := time.Now()
	fmt.Println("▶️ Starting ffmpeg for 60 seconds...")

	err := cmd.Run()
	elapsed := time.Since(start)

	if err != nil {
		fmt.Println("❌ ffmpeg error:", err)
		// if file exists but is tiny, remove it
		if fi, statErr := os.Stat(filePath); statErr == nil {
			if fi.Size() < 1024 {
				_ = os.Remove(filePath)
			}
		}
		// backoff to avoid spamming ffmpeg when camera is down
		time.Sleep(3 * time.Second)
		return
	}

	// sanity-check output file size
	var fi os.FileInfo
	var statErr error
	fi, statErr = os.Stat(filePath)
	if statErr != nil {
		fmt.Println("⚠️ Could not stat file after recording:", statErr)
		_ = os.Remove(filePath)
		return
	} else if fi.Size() < 1024 {
		fmt.Println("⚠️ File too small (likely failed). Deleting:", fi.Size())
		_ = os.Remove(filePath)
		return
	}

	fmt.Printf("✅ Saved: %s (Duration: %.2fs, Size: %d bytes)\n", filePath, elapsed.Seconds(), fi.Size())
}

// isRTSPReachable does a TCP connect to the RTSP host:port (default port 554 if none)
func isRTSPReachable(rtspURL string, timeout time.Duration) bool {
	u, err := url.Parse(rtspURL)
	if err != nil {
		fmt.Println("Invalid RTSP URL:", err)
		return false
	}
	host := u.Host
	if host == "" {
		fmt.Println("RTSP URL missing host")
		return false
	}
	// if host has no port, default to 554
	if _, _, err := net.SplitHostPort(host); err != nil {
		host = net.JoinHostPort(host, "554")
	}
	conn, err := net.DialTimeout("tcp", host, timeout)
	if err != nil {
		// unreachable quickly
		return false
	}
	_ = conn.Close()
	return true
}

// folder creates or returns today's folder name (creates dir if missing)
func folder() string {
	// ensure base path exists
	if _, err := os.Stat(env.Path); os.IsNotExist(err) {
		if err := os.MkdirAll(env.Path, 0755); err != nil {
			fmt.Println("Error creating base path:", err)
			return ""
		}
	}

	folderName := nameProvider("folder")
	dirPath := filepath.Join(env.Path, folderName)
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		if err := os.Mkdir(dirPath, 0755); err != nil {
			fmt.Println("Error creating directory:", err)
			return ""
		}
		fmt.Println("📂 Created folder:", dirPath)
	}
	return folderName
}

// nameProvider returns folder (YYYY-MM-DD) or file (HH-MM-SS) names
func nameProvider(typ string) string {
	times := time.Now().In(time.FixedZone("Asia/Kolkata", 5*60*60+30*60))
	if typ == "folder" {
		return fmt.Sprintf("%d-%02d-%02d", times.Year(), times.Month(), times.Day())
	}
	return fmt.Sprintf("%02d-%02d-%02d", times.Hour(), times.Minute(), times.Second())
}
