import React, { useEffect, useState } from "react";
import context from "./context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

function Main({ children }) {
  // states
  const [current, setCurrent] = useState("");
  const [dates, setDates] = useState([]);
  const [videos, setVideos] = useState([]);
  const [baseURL, setBaseURL] = useState("");

  // effects for run once
  useEffect(() => {
    (async () => {
      // Load saved base URL first and wait for it
      await loadBaseURL();
    })();
  }, []);

  // Separate effect to fetch data when baseURL changes
  useEffect(() => {
    if (baseURL) {
      (async () => {
        let obj = await getdates();
        setDates(obj.dates || []); // extract dates array from response
        setCurrent(obj.current);
        let vids = await getvideos(obj.current);
        setVideos(vids);
      })();
    }
  }, [baseURL]);

  // functions

  // get dates
  let getdates = async () => {
    try {
      console.log("Fetching dates from:", `${baseURL}/getDates`);
      let response = await axios.get(`${baseURL}/getDates`);
      return response.data; // returns {current: "2025-08-08", dates: ["2025-08-07", "2025-08-08"]}
    } catch (error) {
      console.error("Error fetching dates:", error);
      alert("Failed to fetch dates. Please try again later.");
      return { current: "", dates: [] };
    }
  };

  // get videos
  let getvideos = async (date) => {
    try {
      console.log("Fetching videos from:", `${baseURL}/getVideos?date=${date}`);
      let response = await axios.get(`${baseURL}/getVideos`, {
        params: { date },
      });
      let obj = response.data; // returns {date: "2025-08-08", videos: ["15-22-36.mp4", ...]}
      obj.videos.reverse();
      return obj;
    } catch (error) {
      console.error("Error fetching videos:", error);
      alert("Failed to fetch videos. Please try again later.");
      return { date: "", videos: [] };
    }
  };

  // Load base URL from storage
  const loadBaseURL = async () => {
    try {
      const savedURL = await AsyncStorage.getItem("cctv_base_url");
      if (savedURL) {
        console.log("Loaded saved base URL:", savedURL);
        setBaseURL(savedURL);
      } else {
        console.log("No saved URL found, please configure server in settings");
        // Don't set any default URL - user must configure it
        setBaseURL("");
      }
    } catch (error) {
      console.error("Error loading base URL:", error);
      setBaseURL("");
    }
  };

  // Save base URL to storage
  const saveBaseURL = async (url) => {
    try {
      console.log("Saving new base URL:", url);
      await AsyncStorage.setItem("cctv_base_url", url);
      setBaseURL(url);
      // The useEffect will automatically trigger data refresh when baseURL changes
    } catch (error) {
      console.error("Error saving base URL:", error);
      throw error;
    }
  };

  return (
    <context.Provider
      value={{
        current,
        setCurrent,
        dates,
        setDates,
        videos,
        setVideos,
        getdates,
        getvideos,
        baseURL,
        saveBaseURL,
      }}
    >
      {children}
    </context.Provider>
  );
}

export default Main;
