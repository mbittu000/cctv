# Webcam Recording & Management System

## 🎯 What This Project Solves

Ever needed to monitor your space but found existing solutions too complicated, expensive, or lacking the features you want? This project solves that problem by providing a simple, self-hosted webcam recording system that you can set up anywhere.

## 🚨 The Problem

- **Commercial security cameras** are expensive and often require monthly subscriptions
- **Existing software** is either too complex to set up or lacks mobile access
- **Cloud services** store your private recordings on someone else's servers
- **Most solutions** don't let you easily browse and manage recordings from your phone
- **You want control** over your own data and recording schedule

## ✅ How This Solves It

This system gives you:

### **Complete Control**

- Your recordings stay on **your own computer**
- No monthly fees or subscription costs
- Record as much or as little as you want
- Delete old recordings when you choose

### **Simple Setup**

- One command starts the recording server
- Works with any webcam or camera
- Automatically organizes recordings by date and time
- No complicated configuration needed

### **Mobile Access**

- View recordings from anywhere on your phone
- Download important videos to your device
- Browse recordings by date with a calendar
- Watch live feed or recorded videos

### **Privacy First**

- Everything runs on your local network
- Your recordings never leave your control
- No third-party services involved
- Open source - you can see exactly what it does

## 🎬 What It Does

### Recording Server

Continuously records from your webcam in 60-second clips, organizing them by date so you can easily find what you're looking for.

### Mobile App

Browse, watch, and download your recordings from your phone, tablet, or any device with a web browser.

## 🏠 Perfect For

- **Home monitoring** while you're away
- **Office security** for small businesses
- **Pet watching** to see what they do when you're gone
- **Time-lapse projects** with automatic recording
- **Evidence collection** for insurance or security purposes
- **Baby monitoring** with playback capabilities

## 🔧 What You Need

### Option 1: Computer Setup

- A computer with a webcam (Windows, Mac, or Linux)
- A smartphone or tablet for viewing
- Both devices on the same WiFi network

### Option 2: Old Phone as Server (Budget-Friendly!)

- An old Android phone you're not using
- Termux app (free terminal emulator)
- The recording server can run entirely on your spare phone using:
  - **Termux** for the Linux environment
  - **FFmpeg** for video recording
  - **Go** compiler for running the server
- Another phone/tablet for viewing recordings

**Why use an old phone?** Turn that old device collecting dust into a dedicated security camera server that's always on, uses minimal power, and can be placed anywhere with WiFi!

## 🚀 Why I Built This

I needed a simple way to monitor my space without:

- Paying monthly fees to cloud services
- Dealing with complicated security camera setups
- Worrying about privacy and data ownership
- Being locked into proprietary systems

This solution puts you in complete control while being simple enough for anyone to use.

---

**Ready to get started?** Check out the `server/` and `client/` folders for detailed setup instructions.

- **Video Browsing**: Browse recordings by date with calendar interface
- **Video Playback**: Built-in video player with full controls
- **Download Management**: Save videos to device storage
- **Live Streaming**: Real-time viewing of latest recordings
- **Server Configuration**: Configurable server connection settings
- **Storage Management**: View server statistics and delete old recordings

## 🛠️ Quick Start

### Prerequisites

- **Server**: Go 1.24.0+, FFmpeg, Webcam device
- **Client**: Node.js 16+, Expo CLI

### 1. Server Setup

```bash
cd server
go mod tidy
go run main.go
```

The server starts on `http://localhost:8080` with:

- Automatic webcam recording
- REST API endpoints
- Static file serving

### 2. Client Setup

```bash
cd client
npm install
npm start
```

Configure server connection in the app:

- Open app settings
- Enter server URL (e.g., `http://192.168.1.100:8080`)
- Start browsing videos

## 📡 API Overview

The server provides these main endpoints:

| Method   | Endpoint       | Description                       |
| -------- | -------------- | --------------------------------- |
| `GET`    | `/getDates`    | Get all available recording dates |
| `GET`    | `/getVideos`   | Get videos for a specific date    |
| `GET`    | `/getDirStats` | Get server storage statistics     |
| `DELETE` | `/deleteDate`  | Delete all videos for a date      |
| `GET`    | `/static/*`    | Direct access to video files      |

## 🎬 How It Works

### Recording Process

1. **Server starts** and initializes webcam recording
2. **60-second clips** are continuously created using FFmpeg
3. **Videos are organized** by date (YYYY-MM-DD) and time (HH-MM-SS)
4. **Files are stored** in the public directory for HTTP access

### Client Interaction

1. **App connects** to the configured server
2. **Fetches available dates** and video lists
3. **Streams videos** directly from server
4. **Downloads videos** to device storage when requested
5. **Manages server storage** through delete operations

Example file structure:

```
server/public/
└── 2025-08-09/
    ├── 15-22-36.mp4
    ├── 15-23-08.mp4
    └── 15-23-39.mp4
```

## 🔧 Configuration

### Server Configuration

- **Recording duration**: Modify in `server/rec/rec.go`
- **Storage path**: Configure in `server/env/env.go`
- **API port**: Change in `server/uploader/uploader.go`

### Client Configuration

- **Server URL**: Set in app settings or `.env` file
- **App behavior**: Modify in `client/app.json`
- **UI customization**: Update components in `client/src/`

## 📱 Supported Platforms

### Server

- **Windows** ✅
- **macOS** ✅
- **Linux** ✅

### Client

- **iOS** ✅
- **Android** ✅
- **Web** ✅ (via Expo Web)

## 🛠️ Development

### Server Development

```bash
cd server
go run main.go                    # Development
go build -o webcam-server main.go # Production build
```

### Client Development

```bash
cd client
npm start                # Development server
npm run ios             # iOS simulator
npm run android         # Android emulator
expo build:android      # Production APK
expo build:ios          # Production IPA
```

### Adding Features

**Server Side:**

- Add API routes in `server/uploader/router/route.go`
- Modify recording logic in `server/rec/rec.go`
- Update configuration in `server/env/env.go`

**Client Side:**

- Create components in `client/src/components/`
- Add screens in `client/src/pages/`
- Update navigation in `client/App.js`

## 🐛 Troubleshooting

### Server Issues

- **Recording fails**: Check FFmpeg installation and camera permissions
- **API errors**: Verify port availability and firewall settings
- **Storage issues**: Check disk space and directory permissions

### Client Issues

- **Connection failed**: Verify server URL and network connectivity
- **Video playback**: Check video format and network bandwidth
- **Download failures**: Verify storage permissions and available space

### Network Setup

- Ensure both server and client are on the same network
- Configure firewall to allow traffic on server port (default: 8080)
- For remote access, consider port forwarding or VPN setup

## 📊 Performance Considerations

### Server

- **Storage**: ~10-50MB per minute of recording
- **CPU**: Moderate usage during FFmpeg encoding
- **Memory**: Minimal footprint for concurrent operations
- **Network**: Direct file serving, bandwidth scales with concurrent users

### Client

- **Storage**: Downloaded videos consume device storage
- **Network**: Streaming requires stable connection
- **Battery**: Video playback and downloading impact battery life
- **Memory**: Proper video player disposal prevents memory leaks

## 🔒 Security & Production

### Security Notes

- **Local Network**: Designed for trusted local network use
- **No Authentication**: Default setup has no user authentication
- **File Access**: Direct file access through static serving
- **HTTPS**: Consider HTTPS for production deployments

### Production Deployment

- **Server**: Build binary and run as system service
- **Client**: Build APK/IPA for app store distribution
- **Security**: Implement authentication and HTTPS
- **Monitoring**: Add logging and health check endpoints

## 📄 Documentation

- **Server README**: Detailed server setup and API documentation
- **Client README**: Mobile app usage and development guide
- **API Documentation**: Complete endpoint reference with examples

## 📝 License

This project is open source. Please check individual dependencies for their respective licenses.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test both server and client components
4. Ensure compatibility between versions
5. Submit a pull request

### Contribution Areas

- **Server**: Performance optimization, new API endpoints, security features
- **Client**: UI improvements, new features, platform-specific optimizations
- **Documentation**: Setup guides, troubleshooting, examples
- **Testing**: Unit tests, integration tests, platform testing

## 📞 Support

For issues and questions:

- Check the troubleshooting sections in component READMEs
- Review API documentation for integration issues
- Test with minimal setup to isolate problems
- Open an issue with detailed environment information

---

**Note**: This system is designed for local network use. For internet deployment, implement proper security measures including authentication, HTTPS, and access controls.
