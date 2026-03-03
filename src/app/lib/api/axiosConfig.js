"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE } from "./config";

const axiosAuth = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token from cookie or localStorage (so first request after refresh has token)
axiosAuth.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token") || (typeof localStorage !== "undefined" ? localStorage.getItem("token") : null);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401: clear session and notify auth context. Do NOT redirect here.
axiosAuth.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove("token", { path: "/" });
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }
    return Promise.reject(error);
  }
);

export default axiosAuth;
