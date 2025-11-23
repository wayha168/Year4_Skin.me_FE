// src/api/axiosConfig.js
import axios from "axios";
import Cookies from "js-cookie";

const axiosAuth = axios.create({
  baseURL: "https://backend.skinme.store/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // ✅ Add this
  timeout: 10000, // ✅ Add 10 second timeout
});

axiosAuth.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("📤 Request:", config.method?.toUpperCase(), config.url); // ✅ Debug log
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// ✅ Add response interceptor for better error handling
axiosAuth.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.status, response.config.url); // ✅ Debug log
    return response;
  },
  (error) => {
    console.error("❌ Response Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    }
    return Promise.reject(error);
  }
);

export default axiosAuth;