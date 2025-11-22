// src/app/api/axiosConfig.js
import axios from "axios";
import Cookies from "js-cookie";

const axiosAuth = axios.create({
  baseURL: "https://backend.skinme.store/api/v1",
  headers: { "Content-Type": "application/json" },
});

axiosAuth.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosAuth;
