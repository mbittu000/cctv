package recoder

import (
	"cam/env"
	"fmt"
	"log"
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
	filePath := env.Path + "/" + fname + "/" + nameProvider("file") + ".mp4"
	fmt.Println("Recording to:", filePath)
	if fname == "" {
		fmt.Println("Failed to create or find folder.")
		return
	}
	saveFile(filePath)
	fmt.Println("Recording completed and saved to:", filePath)

}

func folder() string {
	dir, err := os.ReadDir(env.Path)
	if err != nil {
		fmt.Println("Error reading directory:", err)
		return ""
	}
	folderName := nameProvider("folder")

	if len(dir) == 0 {
		folderCreate(folderName)
	} else {
		for _, file := range dir {
			if file.IsDir() {
				if (file.Name()) != folderName {
					folderCreate(folderName)
				}
				fmt.Println("Directory found:", file.Name())
			}
		}
	}
	return folderName
}
func folderCreate(name string) {
	err := os.Mkdir(env.Path+"/"+name, 0755)
	if err != nil {
		fmt.Println("Error creating directory:", err)
		return
	}
	fmt.Println("Directory created successfully:", env.Path+"/"+name)

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
		return fmt.Sprintf("%d-%d-%d", yy, mm, dd)
	} else {
		return fmt.Sprintf("%d-%d-%d", hh, min, ss)
	}
}

func saveFile(filepath string) {
	cmd := exec.Command(
		"ffmpeg",
		"-rtsp_transport", "tcp", // more reliable audio
		"-i", "rtsp://192.168.0.104:5543/live/channel0",
		"-map", "0", // ensure all streams are included
		"-t", "60",
		"-c:v", "copy",
		"-c:a", "aac",
		filepath,
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	if err != nil {
		log.Fatalf("FFmpeg error: %v", err)
	}

}
