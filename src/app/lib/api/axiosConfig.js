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

// Attach token automatically
axiosAuth.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token"); 
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401: redirect to login but do NOT clear cookie/localStorage here.
// Session is only cleared on the login page after verifying the token (avoids F5 logout bug
// where a single 401 would wipe a valid session).
axiosAuth.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosAuth;
