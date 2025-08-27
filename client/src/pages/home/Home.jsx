import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  Modal,
  Animated,
  RefreshControl,
  TextInput,
} from "react-native";
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import axios from "axios";
import context from "../../../context/context";

export default function Home() {
  const [selectedTime, setSelectedTime] = useState("-");
  const [currentVideo, setCurrentVideo] = useState(null); // will store filename string
  const [isLive, setIsLive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const [videoSource, setVideoSource] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverURL, setServerURL] = useState("");
  const playerRef = useRef(null); // Keep track of current player instance
  const rotateAnim = useRef(new Animated.Value(0)).current; // Animation for download icon
  const refreshRotateAnim = useRef(new Animated.Value(0)).current; // Animation for refresh icon
  const api = useContext(context);

  // Create video player instance
  const player = useVideoPlayer(videoSource, (player) => {
    console.log("Video player created with source:", videoSource);
    try {
      if (player && videoSource) {
        playerRef.current = player; // Store reference
        player.loop = false; // Disable loop to detect end
      }
    } catch (error) {
      console.error("Error configuring player:", error);
      playerRef.current = null;
    }
  });

  // Effect to update video source when currentVideo or date changes
  useEffect(() => {
    if (currentVideo && api?.videos?.date && api?.baseURL) {
      const newVideoSource = `${api.baseURL}/static/${api.videos.date}/${currentVideo}`;
      console.log("Setting video source:", newVideoSource);
      setVideoSource(newVideoSource);
    } else {
      console.log(
        "Clearing video source - currentVideo:",
        currentVideo,
        "date:",
        api?.videos?.date,
        "baseURL:",
        api?.baseURL
      );
      setVideoSource(null);
      // Clear player reference when source is cleared
      playerRef.current = null;
    }
  }, [currentVideo, api?.videos?.date, api?.baseURL]);

  // Add effect to listen for video end for auto-play
  useEffect(() => {
    if (!player) return;

    try {
      const unsubscribe = player.addListener(
        "playbackStatusUpdate",
        (status) => {
          if (status.isLoaded) {
            setIsLoading(false);
            setIsPlaying(status.isPlaying);

            // Check if video has ended
            if (status.didJustFinish && !isLive) {
              console.log("Video ended, auto-playing next video...");
              setTimeout(() => {
                playNextVideo();
              }, 800);
            }
          } else if (status.error) {
            console.error("Video player error:", status.error);
            setIsLoading(false);
            setIsPlaying(false);
          }
        }
      );

      return () => {
        try {
          if (unsubscribe && typeof unsubscribe.remove === "function") {
            unsubscribe.remove();
          }
        } catch (error) {
          console.error("Error removing listener:", error);
        }
      };
    } catch (error) {
      console.error("Error setting up playback listener:", error);
      return () => {}; // Return empty cleanup function
    }
  }, [player, isLive, playNextVideo]);

  // Auto-play effect when video source changes
  useEffect(() => {
    if (player && videoSource && currentVideo) {
      // Auto-play the video after a short delay
      const timeoutId = setTimeout(() => {
        try {
          // Use the ref to get the current player instance
          const currentPlayer = playerRef.current || player;
          if (
            currentPlayer &&
            typeof currentPlayer.play === "function" &&
            videoSource
          ) {
            console.log("Auto-playing video:", videoSource);
            currentPlayer.play();
          } else {
            console.warn("Player is not available or play method is missing");
          }
        } catch (error) {
          console.error("Error playing video:", error);
          // If there's an error, try to reload by clearing and setting video source again
          setIsLoading(false);
          setIsPlaying(false);
        }
      }, 200); // Increased delay slightly

      return () => clearTimeout(timeoutId);
    }
  }, [player, videoSource, currentVideo]);

  // When videos list changes (after selecting a date / initial load) set first video
  useEffect(() => {
    if (api?.videos?.videos && api.videos.videos.length > 0) {
      setCurrentVideo(api.videos.videos[0]);
    } else {
      setCurrentVideo(null);
    }
  }, [api?.videos]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear player reference on component unmount
      playerRef.current = null;
    };
  }, []);

  // Animation effect for download icon
  useEffect(() => {
    if (isDownloading) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isDownloading, rotateAnim]);

  // Animation effect for refresh icon
  useEffect(() => {
    if (isRefreshing) {
      const rotateAnimation = Animated.loop(
        Animated.timing(refreshRotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    } else {
      refreshRotateAnim.setValue(0);
    }
  }, [isRefreshing, refreshRotateAnim]);

  // Fetch storage information for current date
  const fetchStorageInfo = async (date) => {
    if (!date || !api?.baseURL) return;
    try {
      const response = await axios.get(
        `${api.baseURL}/getDirStats?date=${date}`
      );
      setStorageInfo(response.data);
    } catch (error) {
      console.error("Error fetching storage info:", error);
      setStorageInfo(null);
    }
  };

  // Helper function to format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));

    // For storage display, prefer GB when size is significant
    if (bytes >= k * k * k) {
      const gbValue = parseFloat((bytes / Math.pow(k, 3)).toFixed(2));
      return gbValue + " GB";
    }

    return value + " " + sizes[i];
  };

  // Effect to fetch storage info when current date changes
  useEffect(() => {
    if (api?.current) {
      fetchStorageInfo(api.current);
    }
  }, [api?.current]);

  const handleVideoSelect = useCallback((video) => {
    setCurrentVideo(video);
    // derive a pseudo time label from filename (HH-MM-SS)
    try {
      const core = video.split(".")[0];
      const parts = core.split("-");
      if (parts.length === 3) setSelectedTime(parts.join(":"));
    } catch (e) {}
  }, []);

  // Auto-play next video function
  const playNextVideo = useCallback(() => {
    console.log("playNextVideo called");

    if (!api?.videos?.videos || api.videos.videos.length === 0) {
      console.log("No videos available for auto-play");
      return;
    }

    const currentIndex = api.videos.videos.findIndex(
      (video) => video === currentVideo
    );

    if (currentIndex !== -1 && currentIndex < api.videos.videos.length - 1) {
      // Play next video
      const nextVideo = api.videos.videos[currentIndex + 1];
      console.log(`Auto-playing next video: ${nextVideo}`);
      handleVideoSelect(nextVideo);
    } else {
      // If it's the last video, loop back to first
      const firstVideo = api.videos.videos[0];
      console.log(`Reached end, looping back to first video: ${firstVideo}`);
      handleVideoSelect(firstVideo);
    }
  }, [api?.videos?.videos, currentVideo, handleVideoSelect]);

  const handleDatePicker = () => {
    setShowCalendar(true);
  };

  const handleDownload = async () => {
    if (!currentVideo || !videoSource) {
      Alert.alert("Error", "No video selected to download");
      return;
    }

    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant media library permission to download videos"
        );
        return;
      }

      setIsDownloading(true);
      setDownloadProgress(0);

      // Create a progress callback
      const progressCallback = (progress) => {
        const progressPercent = Math.round(
          (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) *
            100
        );
        setDownloadProgress(progressPercent);
      };

      // Download the video file
      const fileUri = FileSystem.documentDirectory + currentVideo;
      const downloadResumable = FileSystem.createDownloadResumable(
        videoSource,
        fileUri,
        {},
        progressCallback
      );

      const downloadResult = await downloadResumable.downloadAsync();

      if (downloadResult?.uri) {
        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);

        // Create or get the album
        const albumName = "CCTV Videos";
        let album = await MediaLibrary.getAlbumAsync(albumName);
        if (!album) {
          album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        Alert.alert(
          "Download Complete",
          `Video "${currentVideo}" has been saved to your gallery in the "${albumName}" album.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert(
        "Download Failed",
        `Failed to download video: ${error.message}`
      );
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleTimePicker = () => {
    Alert.alert(
      "Time Picker",
      "Time picker functionality would be implemented here"
    );
  };

  const handleLiveToggle = () => {
    setIsLive(!isLive);
    Alert.alert(
      isLive ? "Live Mode Off" : "Live Mode On",
      isLive ? "Switched to recorded footage" : "Switching to live footage"
    );
  };

  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes

    setIsRefreshing(true);
    try {
      console.log("Refreshing videos...");

      // Get latest dates and current date
      const datesObj = await api.getdates();
      api.setDates(datesObj.dates || []);

      // If current date has changed, update it
      if (datesObj.current !== api.current) {
        api.setCurrent(datesObj.current);
      }

      // Get latest videos for current date
      const currentDate = datesObj.current || api.current;
      if (currentDate) {
        const vidsObj = await api.getvideos(currentDate);
        const oldVideoCount = api.videos?.videos?.length || 0;
        const newVideoCount = vidsObj.videos?.length || 0;

        api.setVideos(vidsObj);

        // Refresh storage info as well
        await fetchStorageInfo(currentDate);
      }
    } catch (error) {
      console.error("Refresh error:", error);
      Alert.alert(
        "Refresh Failed",
        "Failed to refresh videos. Please check your connection and try again."
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleServerConfig = () => {
    setServerURL(api?.baseURL || "");
    setShowServerConfig(true);
  };

  const handleSaveServerConfig = async () => {
    if (!serverURL.trim()) {
      Alert.alert("Error", "Please enter a valid server URL");
      return;
    }

    // Validate URL format
    try {
      new URL(serverURL.trim());
    } catch (e) {
      Alert.alert(
        "Error",
        "Please enter a valid URL (e.g., http://192.168.1.100:8080)"
      );
      return;
    }

    try {
      const cleanURL = serverURL.trim().replace(/\/$/, ""); // Remove trailing slash
      await api.saveBaseURL(cleanURL);
      setShowServerConfig(false);

      Alert.alert(
        "Server Updated",
        "Server URL updated successfully. The app will refresh to load data from the new server.",
        [
          {
            text: "OK",
            onPress: () => {
              // Refresh data with new server
              handleRefresh();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save server URL. Please try again.");
    }
  };

  const handleSelectDate = async (date) => {
    if (date === api.current) return;
    try {
      api.setCurrent(date);
      const vidsObj = await api.getvideos(date);
      api.setVideos(vidsObj);
      // currentVideo will be set by effect
    } catch (err) {
      Alert.alert("Error", "Failed to load videos for selected date");
    }
  };

  const handleDeleteDate = async (date) => {
    Alert.alert(
      "Delete Footage",
      `Are you sure you want to delete all footage for ${date}? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${api.baseURL}/deleteDate?date=${date}`);

              // Refresh dates list
              const datesObj = await api.getdates();
              api.setDates(datesObj.dates || []);

              // If deleted date was current, switch to first available date
              if (date === api.current) {
                const remainingDates = datesObj.dates || [];
                if (remainingDates.length > 0) {
                  const newDate = remainingDates[0];
                  api.setCurrent(newDate);
                  const vidsObj = await api.getvideos(newDate);
                  api.setVideos(vidsObj);
                } else {
                  api.setCurrent("");
                  api.setVideos({ videos: [] });
                }
              }

              Alert.alert("Success", `Footage for ${date} has been deleted`);
            } catch (err) {
              Alert.alert(
                "Error",
                "Failed to delete footage. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerText}>CCTV</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.serverButton}
              onPress={handleServerConfig}
            >
              <Ionicons name="settings" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                isRefreshing && styles.refreshButtonActive,
              ]}
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: refreshRotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.liveButton, isLive && styles.liveButtonActive]}
              onPress={handleLiveToggle}
            >
              <View style={[styles.liveDot, isLive && styles.liveDotActive]} />
              <Text
                style={[
                  styles.liveButtonText,
                  isLive && styles.liveButtonTextActive,
                ]}
              >
                {isLive ? "LIVE" : "REC"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {currentVideo && videoSource ? (
          <>
            <VideoView
              style={styles.video}
              player={player}
              nativeControls={true}
              resizeMode="contain"
            />

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingIndicator}>
                  <Ionicons name="refresh" size={24} color="#fff" />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={[styles.video, styles.videoEmpty]}>
            <Text style={styles.videoEmptyText}>No videos for this date</Text>
          </View>
        )}
        {isLive && <View style={styles.liveGlow} />}
      </View>

      {/* Scrollable Bottom Section */}
      <ScrollView
        style={styles.bottomSection}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bottomSectionContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
            colors={["#6495ED"]}
            progressBackgroundColor="#333"
          />
        }
      >
        {/* Control Buttons */}
        <View style={styles.controlPanel}>
          <TouchableOpacity
            style={[styles.controlButton, styles.dateButton]}
            onPress={handleDatePicker}
          >
            <Ionicons name="calendar" size={18} color="#fff" />
            <Text style={styles.controlButtonText}>
              {api.current || "Date"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.downloadButton,
              isDownloading && styles.downloadButtonActive,
            ]}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
              </Animated.View>
            ) : (
              <Ionicons name="download" size={18} color="#fff" />
            )}
            <Text style={styles.controlButtonText}>
              {isDownloading ? `${downloadProgress}%` : "Download"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.timeButton]}
            onPress={handleTimePicker}
          >
            <Ionicons name="time" size={18} color="#fff" />
            <Text style={styles.controlButtonText} numberOfLines={1}>
              {selectedTime}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Storage Information */}
        {storageInfo && (
          <View style={styles.storagePanel}>
            <View style={styles.storageHeader}>
              <Ionicons name="server-outline" size={20} color="#fff" />
              <Text style={styles.storageTitle}>
                Storage Usage - {api.current}
              </Text>
            </View>
            <View style={styles.storageStats}>
              <View style={styles.storageStat}>
                <Text style={styles.storageStatLabel}>Total Size</Text>
                <Text style={styles.storageStatValue}>
                  {formatBytes(storageInfo.total || 0)}
                </Text>
              </View>
              <View style={styles.storageStat}>
                <Text style={styles.storageStatLabel}>Files</Text>
                <Text style={styles.storageStatValue}>
                  {api?.videos?.videos?.length || 0}
                </Text>
              </View>
              <View style={styles.storageStat}>
                <Text style={styles.storageStatLabel}>Avg Size</Text>
                <Text style={styles.storageStatValue}>
                  {api?.videos?.videos?.length > 0
                    ? formatBytes(
                        (storageInfo.total || 0) / api.videos.videos.length
                      )
                    : "0 Bytes"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Video List */}
        <View style={styles.videoListContainer}>
          <Text style={styles.sectionTitle}>Recent Recordings</Text>
          {api?.videos?.videos?.length > 0 ? (
            api.videos.videos.map((video) => {
              const selected = currentVideo === video;
              let timeStr = "";
              try {
                timeStr = video.split(".")[0].split("-").join(":");
              } catch (e) {}
              return (
                <TouchableOpacity
                  key={video}
                  style={[
                    styles.videoItem,
                    selected && styles.selectedVideoItem,
                  ]}
                  onPress={() => handleVideoSelect(video)}
                >
                  <View style={styles.videoItemContent}>
                    <View style={styles.videoItemInfo}>
                      <Text style={styles.videoItemTitle} numberOfLines={1}>
                        {video}
                      </Text>
                      <Text style={styles.videoItemDate}>{timeStr}</Text>
                    </View>
                    <Ionicons
                      name="play-circle"
                      size={24}
                      color={selected ? "#007AFF" : "#666"}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyVideoList}>
              <Ionicons
                name="videocam-off"
                size={48}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.emptyVideoText}>
                No recordings for this date
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCalendar(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.datesList}>
              {api?.dates?.map((dateStr) => {
                const active = dateStr === api.current;
                return (
                  <View
                    key={dateStr}
                    style={[styles.dateItem, active && styles.dateItemActive]}
                  >
                    <TouchableOpacity
                      style={styles.dateSelectArea}
                      onPress={() => {
                        handleSelectDate(dateStr);
                        setShowCalendar(false);
                      }}
                    >
                      <View style={styles.dateItemContent}>
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color={active ? "#007AFF" : "#fff"}
                        />
                        <Text
                          style={[
                            styles.dateItemText,
                            active && styles.dateItemTextActive,
                          ]}
                        >
                          {dateStr}
                        </Text>
                        {active && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#007AFF"
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteDate(dateStr)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#ff4444"
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Server Configuration Modal */}
      <Modal
        visible={showServerConfig}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowServerConfig(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.serverConfigModal}>
            <View style={styles.serverConfigHeader}>
              <Text style={styles.serverConfigTitle}>Server Configuration</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowServerConfig(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.serverConfigContent}>
              <Text style={styles.serverConfigLabel}>Server URL:</Text>
              <TextInput
                style={styles.serverConfigInput}
                value={serverURL}
                onChangeText={setServerURL}
                placeholder="http://192.168.1.100:8080"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              <Text style={styles.serverConfigHint}>
                Enter the IP address and port of your CCTV server
              </Text>

              <View style={styles.serverConfigButtons}>
                <TouchableOpacity
                  style={[styles.serverConfigButton, styles.cancelButton]}
                  onPress={() => setShowServerConfig(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.serverConfigButton, styles.saveButton]}
                  onPress={handleSaveServerConfig}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: "#000",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 32,
    fontWeight: "300",
    color: "#fff",
    letterSpacing: 4,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refreshButton: {
    backgroundColor: "rgba(100,149,237,0.2)",
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(100,149,237,0.3)",
  },
  refreshButtonActive: {
    backgroundColor: "rgba(0,200,0,0.2)",
    borderColor: "rgba(0,200,0,0.3)",
  },
  serverButton: {
    backgroundColor: "rgba(255,165,0,0.2)",
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,165,0,0.3)",
  },
  liveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  liveButtonActive: {
    backgroundColor: "#ff0844",
    borderColor: "#ff0844",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginRight: 8,
  },
  liveDotActive: {
    backgroundColor: "#fff",
  },
  liveButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
  },
  liveButtonTextActive: {
    color: "#fff",
  },
  videoContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111",
    position: "relative",
  },
  video: {
    width: "100%",
    height: 280,
    backgroundColor: "#000",
  },
  videoTouchOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  videoEmpty: {
    alignItems: "center",
    justifyContent: "center",
  },
  videoEmptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  liveGlow: {
    position: "absolute",
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#ff0844",
    zIndex: -1,
  },
  bottomSection: {
    flex: 1,
  },
  bottomSectionContent: {
    paddingBottom: 20,
  },
  controlPanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    gap: 12,
  },
  storagePanel: {
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  storageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  storageTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  storageStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  storageStat: {
    alignItems: "center",
    flex: 1,
  },
  storageStatLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginBottom: 4,
  },
  storageStatValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  controlButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dateButton: {
    backgroundColor: "rgba(100,100,255,0.15)",
    borderColor: "rgba(100,100,255,0.3)",
  },
  downloadButton: {
    backgroundColor: "rgba(0,122,255,0.2)",
    borderColor: "rgba(0,122,255,0.4)",
  },
  downloadButtonActive: {
    backgroundColor: "rgba(0,200,0,0.2)",
    borderColor: "rgba(0,200,0,0.4)",
  },
  timeButton: {
    backgroundColor: "rgba(255,100,150,0.15)",
    borderColor: "rgba(255,100,150,0.3)",
  },
  controlButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  videoListContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "400",
    color: "#fff",
    marginBottom: 20,
    letterSpacing: 1,
  },
  videoItem: {
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  selectedVideoItem: {
    backgroundColor: "rgba(0,122,255,0.1)",
    borderColor: "rgba(0,122,255,0.3)",
  },
  videoItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoItemInfo: {
    flex: 1,
  },
  videoItemTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 6,
  },
  videoItemDate: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "400",
  },
  emptyVideoList: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyVideoText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    backgroundColor: "#111",
    borderRadius: 20,
    margin: 20,
    maxHeight: "70%",
    width: "90%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  calendarTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  datesList: {
    maxHeight: 400,
  },
  dateItem: {
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    alignItems: "center",
  },
  dateItemActive: {
    backgroundColor: "rgba(0,122,255,0.15)",
    borderColor: "#007AFF",
  },
  dateSelectArea: {
    flex: 1,
  },
  dateItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  deleteButton: {
    padding: 12,
    marginRight: 8,
    backgroundColor: "rgba(255,68,68,0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,68,68,0.3)",
  },
  dateItemText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  dateItemTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  loadingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  // Video Controls Styles
  videoContainerFullscreen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    margin: 0,
    borderRadius: 0,
  },
  videoFullscreen: {
    height: "100%",
  },
  videoControlsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "space-between",
    zIndex: 2,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  videoTime: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  fullscreenButton: {
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
  centerControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  controlBtn: {
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  playButton: {
    padding: 16,
    backgroundColor: "rgba(0,122,255,0.8)",
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  seekBarContainer: {
    height: 30,
    justifyContent: "center",
  },
  seekBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  seekProgress: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 2,
  },
  // Server Configuration Modal Styles
  serverConfigModal: {
    backgroundColor: "#111",
    borderRadius: 20,
    margin: 20,
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  serverConfigHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  serverConfigTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  serverConfigContent: {
    padding: 20,
  },
  serverConfigLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  serverConfigInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 15,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 10,
  },
  serverConfigHint: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  serverConfigButtons: {
    flexDirection: "row",
    gap: 12,
  },
  serverConfigButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
