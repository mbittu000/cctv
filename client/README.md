# Webcam Client App

A React Native (Expo) mobile application for viewing and managing webcam recordings from the Webcam Recording Server.

## 🎯 Overview

This mobile application provides a user-friendly interface to browse, view, and manage webcam recordings stored on the server. It features video playback, date-based organization, download capabilities, and server configuration management.

## 🏗️ Architecture

```
client/
├── App.js               # Main app entry point with navigation
├── app.json            # Expo configuration
├── package.json        # Dependencies and scripts
├── .env                # Environment variables
├── assets/             # App icons and splash screens
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── splash-icon.png
│   └── favicon.png
├── context/            # React Context for state management
│   ├── context.js      # Context definition
│   └── Main.jsx        # Context provider with API logic
├── src/
│   ├── components/     # Reusable UI components
│   └── pages/
│       ├── home/
│       │   └── Home.jsx # Main video viewer screen
│       └── temp/       # Temporary/development pages
└── .expo/              # Expo build and development files
```

## 🚀 Features

### Video Management

- **Browse by Date**: View recordings organized by date
- **Video Playback**: Built-in video player with controls
- **Live Mode**: Stream the latest recordings
- **Download Videos**: Save videos to device storage
- **Delete Management**: Remove recordings from server

### User Interface

- **Responsive Design**: Optimized for mobile devices
- **Dark/Light Theme**: Adaptive UI styling
- **Calendar View**: Easy date selection
- **Storage Info**: View server storage statistics
- **Pull-to-Refresh**: Update content with gesture

### Server Integration

- **Configurable Server**: Set custom server URL
- **API Integration**: Full REST API communication
- **Offline Support**: Local storage for settings
- **Error Handling**: Graceful error management

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator / Android Emulator (for testing)
- Physical device with Expo Go app (for testing)

## 🛠️ Installation & Setup

1. **Navigate to client directory**

   ```bash
   cd client
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment** (Optional)

   Create or edit `.env` file:

   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8080
   ```

4. **Start the development server**

   ```bash
   npm start
   # or
   yarn start
   ```

5. **Run on your preferred platform**

   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

## 📱 App Configuration

### Server Setup

On first launch, configure your server connection:

1. **Open the app**
2. **Tap the settings icon** (gear icon)
3. **Enter your server URL** (e.g., `http://192.168.1.100:8080`)
4. **Save configuration**

The app will automatically connect and load available recordings.

### Network Requirements

- Both device and server must be on the same network (for local setup)
- Server must be running on the configured port (default: 8080)
- Firewall should allow connections to the server

## 🎮 Usage

### Browsing Videos

1. **Select Date**: Use the calendar button to choose a recording date
2. **Browse Videos**: Scroll through available recordings for that date
3. **Play Video**: Tap on any video thumbnail to start playback

### Video Controls

- **Play/Pause**: Tap the video or use control buttons
- **Seek**: Drag the progress bar to jump to specific times
- **Full Screen**: Rotate device or use full-screen controls
- **Download**: Use download button to save to device
- **Live Mode**: Toggle live mode for real-time viewing

### Managing Storage

- **View Stats**: Check server storage information
- **Delete Videos**: Remove old recordings to free space
- **Refresh**: Pull down to refresh the video list

## 🔧 Configuration

### App Settings

Edit `app.json` for app configuration:

```json
{
  "expo": {
    "name": "Webcam Client",
    "slug": "webcam-client",
    "version": "1.0.0",
    "orientation": "portrait"
  }
}
```

### Permissions

The app requests the following permissions:

- **Storage Access**: For downloading videos
- **Network Access**: For server communication

### Environment Variables

Create `.env` file for configuration:

```env
EXPO_PUBLIC_API_URL=http://your-server-ip:8080
EXPO_PUBLIC_APP_NAME=Webcam Client
```

## 📦 Dependencies

### Core Dependencies

- **React Native**: Mobile app framework
- **Expo**: Development platform
- **Expo Video**: Video playback component
- **React Navigation**: Screen navigation
- **Axios**: HTTP client for API calls

### Media & Storage

- **Expo File System**: File operations
- **Expo Media Library**: Device media access
- **AsyncStorage**: Local data persistence

### UI Components

- **Expo Vector Icons**: Icon library
- **React Native Elements**: UI components
- **Animated API**: Smooth animations

## 🔌 API Integration

The app communicates with the server using these endpoints:

| Endpoint       | Purpose                         |
| -------------- | ------------------------------- |
| `/getDates`    | Fetch available recording dates |
| `/getVideos`   | Get videos for specific date    |
| `/getDirStats` | Server storage statistics       |
| `/deleteDate`  | Delete recordings for a date    |
| `/static/*`    | Stream/download video files     |

### Error Handling

The app handles various error scenarios:

- **Network Errors**: Connection issues
- **Server Errors**: API failures
- **Video Errors**: Playback issues
- **Storage Errors**: Download failures

## 🛠️ Development

### Project Structure

- **Components**: Reusable UI elements in `src/components/`
- **Pages**: Screen components in `src/pages/`
- **Context**: Global state management in `context/`
- **Assets**: Images and icons in `assets/`

### Adding New Features

1. **New Screens**: Add components to `src/pages/`
2. **Navigation**: Update navigation in `App.js`
3. **API Calls**: Extend context provider in `context/Main.jsx`
4. **UI Components**: Create reusable components in `src/components/`

### State Management

The app uses React Context for global state:

```javascript
// Access context in components
const { dates, videos, current, baseURL } = useContext(context);
```

### Custom Hooks

Consider creating custom hooks for:

- Video player management
- API call abstractions
- Storage operations
- Animation controls

## 📱 Building for Production

### Android APK

```bash
expo build:android
# or for new Expo CLI
eas build --platform android
```

### iOS IPA

```bash
expo build:ios
# or for new Expo CLI
eas build --platform ios
```

### Web Deployment

```bash
expo build:web
# Deploy to hosting service
```

## 🐛 Troubleshooting

### Common Issues

1. **Server Connection Failed**

   - Verify server is running
   - Check IP address and port
   - Ensure devices are on same network
   - Check firewall settings

2. **Video Playback Issues**

   - Verify video file format (MP4)
   - Check network bandwidth
   - Ensure proper codec support
   - Try different video files

3. **Download Failures**

   - Check device storage space
   - Verify storage permissions
   - Ensure stable network connection
   - Check file accessibility

4. **App Crashes**
   - Check Expo CLI version
   - Verify all dependencies are installed
   - Clear Expo cache: `expo r -c`
   - Check device compatibility

### Debug Mode

Run in development mode with detailed logging:

```bash
expo start --dev-client
```

### Performance Tips

- **Optimize Images**: Use appropriate image sizes
- **Lazy Loading**: Implement for large video lists
- **Memory Management**: Properly dispose video players
- **Network Optimization**: Cache frequently accessed data

## 🔒 Security Considerations

- **Server URLs**: Use HTTPS in production
- **API Keys**: Store securely if authentication is added
- **Local Storage**: Encrypt sensitive data
- **Network Security**: Validate server certificates

## 📄 License

This project is open source. Please check individual dependencies for their respective licenses.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test on multiple devices
4. Ensure proper error handling
5. Submit a pull request

### Development Guidelines

- Follow React Native best practices
- Use TypeScript for type safety (future enhancement)
- Implement proper error boundaries
- Add unit tests for critical functions
- Follow Expo guidelines for submissions

---

**Note**: This client app is designed to work with the Webcam Recording Server. Ensure the server is properly configured and running before using the app.
