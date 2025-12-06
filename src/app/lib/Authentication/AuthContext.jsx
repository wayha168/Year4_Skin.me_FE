"use client";

import { createContext, useEffect, useState, useContext } from "react";
import Cookies from "js-cookie";
import axiosAuth from "../api/axiosConfig";
import { useRouter } from "next/navigation";

// Create Auth Context
const AuthContext = createContext({});

// Auth Provider
export const AuthProvider = ({ children }) => {
  const router = useRouter();

  // User state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Client mount flag to avoid SSR hydration mismatch
  const [isClient, setIsClient] = useState(false);

  // Run only on client
  useEffect(() => {
    setIsClient(true);

    const initAuth = async () => {
      const token = Cookies.get("token");

      if (token) {
        // Load user from localStorage if exists
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          setUser({ ...JSON.parse(savedUser), token });
          setLoading(false);
        }

        // Fetch latest user info from API
        await fetchUser(token);
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Fetch current user info
  const fetchUser = async (token) => {
    try {
      const response = await axiosAuth.get("/users/me");
      if (response.status === 200) {
        const userData = response.data.data;
        setUser({ ...userData, token });
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async ({ email, password }) => {
    try {
      setError("");
      const response = await axiosAuth.post("/auth/login", { email, password });

      if (response.status === 200 && response.data?.data?.jwtToken) {
        const token = response.data.data.jwtToken;
        const userData = response.data.data;

        Cookies.set("token", token, { expires: 7 });
        localStorage.setItem("user", JSON.stringify(userData));

        setUser({ ...userData, token });
        return userData;
      } else {
        let message = response.data?.message || "Login failed";
        if (message === "Invalid email or password") message = "Incorrect email or password";
        setError(message);
        return null;
      }
    } catch (err) {
      console.error("Login error:", err.response || err);
      const message = err.response?.data?.message || "Network error";
      setError(message);
      return null;
    }
  };

  // Signup function
  const signup = async (data) => {
    try {
      setError("");
      const response = await axiosAuth.post("/auth/signup", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (response.status === 200 || response.status === 201) {
        // Auto-login after signup
        const userData = await login({ email: data.email, password: data.password });
        return userData;
      } else {
        setError(response.data?.message || "Signup failed");
        return null;
      }
    } catch (err) {
      console.error("Signup error:", err.response || err);
      const message = err.response?.data?.message || "Network error during signup";
      setError(message);
      return null;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const token = Cookies.get("token");

      Cookies.remove("token");
      localStorage.removeItem("user");
      setUser(null);

      router.push("/login");

      if (token) {
        await axiosAuth.post("/auth/logout");
      }
    } catch (err) {
      console.error("Logout error:", err);
      Cookies.remove("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    if (!user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);
    return roles.some((r) => r === "ROLE_ADMIN" || r === "ADMIN");
  };

  // Prevent SSR hydration mismatch
  if (!isClient) return null;

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export default function useAuthContext() {
  return useContext(AuthContext);
}
