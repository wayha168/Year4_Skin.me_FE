"use client"; 

import axios from "axios";
import Cookies from "js-cookie";

const axiosAuth = axios.create({
  baseURL: "https://backend.skinme.store/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically
axiosAuth.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token"); 
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 Unauthorized globally
axiosAuth.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("token");
      localStorage.removeItem("user");

      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosAuth;
