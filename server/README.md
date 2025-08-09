# Webcam Recording Server

A Go-based backend server for automated webcam recording with RESTful API for video management.

## 🎯 Overview

This server application provides automated webcam recording capabilities with a built-in web API for managing recorded videos. It continuously records webcam footage in 60-second intervals and organizes them by date and time.

## 🏗️ Architecture

```
server/
├── main.go          # Entry point - starts recording and API services
├── rec/             # Recording functionality
│   └── rec.go       # Webcam recording logic with FFmpeg
├── uploader/        # API server & file management
│   ├── uploader.go  # Fiber web server setup
│   └── router/      # API route handlers
│       └── route.go
├── env/             # Environment configuration
│   └── env.go
├── public/          # Static video files storage (organized by date)
│   └── YYYY-MM-DD/  # Date folders containing MP4 files
├── tmp/             # Temporary build files
└── go.mod           # Go module dependencies
```

## 🚀 Features

- **Automated Recording**: Continuous webcam recording in 60-second intervals
- **Video Management**: RESTful API for video operations
- **Static File Serving**: Serves recorded videos over HTTP
- **Concurrent Processing**: Simultaneous recording and API serving
- **Date Organization**: Videos automatically organized by recording date
- **Storage Management**: API endpoints for managing storage and deleting old recordings

## 📋 Prerequisites

- Go 1.24.0 or higher
- FFmpeg (for video recording)
- Webcam/camera device

### Client Requirements

- Webcam/camera device
- Operating system with camera access permissions

## 🛠️ Installation & Setup

1. **Navigate to server directory**

   ```bash
   cd server
   ```

2. **Install Go dependencies**

   ```bash
   go mod tidy
   ```

3. **Configure environment**

   - Set up your video storage path in `env/env.go`
   - Ensure FFmpeg is installed and accessible in your system PATH

4. **Run the server**

   ```bash
   go run main.go
   ```

The server will start:

- Recording service (background process)
- API server on port `:8080`

## 🔧 Configuration

- **Recording Duration**: Modify timeout in `rec/rec.go` (default: 60 seconds)
- **Storage Path**: Configure in `env/env.go`
- **API Port**: Change in `uploader/uploader.go` (default: 8080)

### Environment Setup

Edit `env/env.go` to configure:

```go
var Path = "./public"  // Video storage directory
```

## 📡 API Endpoints

| Method   | Endpoint         | Description                           |
| -------- | ---------------- | ------------------------------------- |
| `GET`    | `/getDates`      | Get all available recording dates     |
| `GET`    | `/getVideos`     | Get videos for a specific date        |
| `GET`    | `/getDirStats`   | Get directory statistics              |
| `GET`    | `/getVideoStats` | Get video file statistics             |
| `DELETE` | `/deleteDate`    | Delete all videos for a specific date |
| `GET`    | `/static/*`      | Serve static video files              |

### Example API Usage

**Get available dates:**

```bash
curl http://localhost:8080/getDates
```

**Get videos for a specific date:**

```bash
curl http://localhost:8080/getVideos?date=2025-08-08
```

**Access video file directly:**

```bash
curl http://localhost:8080/static/2025-08-08/15-22-36.mp4
```

## 📁 File Structure

- `main.go` - Application entry point, starts recording and API services
- `rec/rec.go` - Webcam recording logic with FFmpeg
- `uploader/uploader.go` - Fiber web server setup
- `uploader/router/route.go` - API route handlers
- `env/env.go` - Environment configuration
- `public/` - Video file storage (organized by date)

## 🎬 Video Recording

The server automatically:

1. **Starts recording** when launched
2. **Creates 60-second clips** continuously using FFmpeg
3. **Organizes by date** (YYYY-MM-DD format)
4. **Names by time** (HH-MM-SS format)
5. **Stores in public directory** for HTTP access

Example file structure:

```
public/
└── 2025-08-08/
    ├── 15-22-36.mp4
    ├── 15-23-08.mp4
    └── 15-23-39.mp4
```

## ⚙️ Technical Details

### Dependencies

- **Fiber v2**: High-performance web framework
- **FFmpeg**: Video recording and processing
- **UUID**: Unique identifier generation

### Concurrency

The server uses Go goroutines for:

- Continuous video recording
- Simultaneous API serving
- Non-blocking operations

### File Management

- Videos are stored in date-based directories
- Automatic cleanup capabilities via API
- Static file serving for direct access

## 🛠️ Development

### Building for Production

```bash
go build -o webcam-server main.go
```

### Running as Service

For production deployment, consider running as a system service:

**Linux (systemd):**

```bash
sudo systemctl enable webcam-server
sudo systemctl start webcam-server
```

**Windows:**

Use tools like NSSM to run as Windows service.

### Adding New Features

1. **New API endpoints**: Add routes in `uploader/router/route.go`
2. **Recording modifications**: Update logic in `rec/rec.go`
3. **Configuration changes**: Modify `env/env.go`

## 🐛 Troubleshooting

### Common Issues

1. **Recording fails**

   - Check if FFmpeg is installed and in PATH
   - Verify camera permissions
   - Ensure camera is not used by another application
   - Check disk space availability

2. **API server issues**

   - Verify port 8080 is not in use
   - Check firewall settings
   - Ensure proper file permissions for public directory

3. **Video file issues**

   - Verify FFmpeg encoding settings
   - Check storage directory permissions
   - Monitor disk space usage

### Debug Mode

Run with verbose logging:

```bash
go run main.go -v
```

## 📈 Performance Considerations

- **Storage**: Videos accumulate quickly (60 seconds = ~10-50MB depending on quality)
- **CPU**: FFmpeg encoding uses moderate CPU resources
- **Memory**: Minimal memory footprint for concurrent operations
- **Network**: API serves files directly, consider bandwidth for remote access

## 🔒 Security Notes

- Server binds to all interfaces (0.0.0.0:8080) by default
- No authentication implemented - suitable for local network use
- For internet deployment, add authentication and HTTPS
- Consider file access controls for sensitive recordings

## 📄 License

This project is open source. Please check individual dependencies for their respective licenses.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test recording and API functionality
4. Submit a pull request

---

**Note**: This server is designed for local network use. For internet deployment, implement proper security measures including authentication and encrypted connections.
