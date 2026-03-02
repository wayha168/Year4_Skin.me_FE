"use client";

import { createContext, useEffect, useState, useContext, useRef } from "react";
import Cookies from "js-cookie";
import axiosAuth from "../api/axiosConfig";
import { API_BASE } from "../api/config";
import { useRouter } from "next/navigation";

// Create Auth Context
const AuthContext = createContext({});

// Restore user from cookie + localStorage (client-only). Call only in useEffect so it never runs on server.
function restoreSession() {
  if (typeof window === "undefined") return null;
  const token = Cookies.get("token");
  if (!token) return null;
  try {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return { ...parsed, token };
  } catch {
    return null;
  }
}

// Auth Provider
export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const initDone = useRef(false);

  // User state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Restore session from cookie on mount/refresh. Run only on client, only once, and after
  // the client is ready so cookie/localStorage are available (avoids F5 logout).
  useEffect(() => {
    if (typeof window === "undefined" || initDone.current) return;
    initDone.current = true;

    const runRestore = () => {
      const restored = restoreSession();
      if (restored) {
        setUser(restored);
        setLoading(false);
        return;
      }
      const token = Cookies.get("token");
      if (token) {
        fetchUser(token).finally(() => {});
        return;
      }
      setLoading(false);
    };

    // Defer so cookie/localStorage are definitely available (fixes refresh logout)
    const t = window.setTimeout(runRestore, 0);
    return () => clearTimeout(t);
  }, []);

  // Fetch current user info (only clear session on 401; keep user on other errors)
  const fetchUser = async (token) => {
    try {
      const response = await axiosAuth.get("/users/user-profile");
      if (response.status === 200) {
        const userData = response.data?.data ?? response.data;
        if (userData) {
          setUser({ ...userData, token });
          localStorage.setItem("user", JSON.stringify(userData));
        }
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        Cookies.remove("token", { path: "/" });
        localStorage.removeItem("user");
        setUser(null);
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
      // On 404/500/network: keep user from cookie + localStorage, don't logout
    } finally {
      setLoading(false);
    }
  };

  // Google login: fetch backend auth API directly (same as other API calls via API_BASE)
  const googleLogin = async (code) => {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.data?.jwtToken) {
        const token = data.data.jwtToken;
        const userData = data.data;

        Cookies.set("token", token, {
          expires: 7,
          path: "/",
          sameSite: "Lax",
          secure: typeof window !== "undefined" && window.location?.protocol === "https:",
        });
        localStorage.setItem("user", JSON.stringify(userData));
        setUser({ ...userData, token });
        return userData;
      }
      setError(data?.message || "Google sign-in failed");
      return null;
    } catch (err) {
      console.error("Google login error:", err);
      setError("Network error");
      return null;
    }
  };

  // Login: fetch backend auth API directly (same as Google login via API_BASE)
  const login = async ({ email, password }) => {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.data?.jwtToken) {
        const token = data.data.jwtToken;
        const userData = data.data;

        Cookies.set("token", token, {
          expires: 7,
          path: "/",
          sameSite: "Lax",
          secure: typeof window !== "undefined" && window.location?.protocol === "https:",
        });
        localStorage.setItem("user", JSON.stringify(userData));
        setUser({ ...userData, token });
        return userData;
      }
      const message = data?.message || "Login failed";
      setError(message === "Invalid email or password" ? "Incorrect email or password" : message);
      return null;
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error");
      return null;
    }
  };

  // Signup: fetch backend auth API directly (same as login / Google via API_BASE)
  const signup = async (data) => {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
        credentials: "include",
      });
      const resData = await res.json().catch(() => ({}));

      if (res.ok || res.status === 200 || res.status === 201) {
        const userData = await login({ email: data.email, password: data.password });
        return userData;
      }
      setError(resData?.message || "Signup failed");
      return null;
    } catch (err) {
      console.error("Signup error:", err);
      setError("Network error during signup");
      return null;
    }
  };

  // Clear session only (no redirect). Used by login page when token verify returns 401.
  const clearSession = () => {
    Cookies.remove("token", { path: "/" });
    localStorage.removeItem("user");
    setUser(null);
  };

  // Logout function
  const logout = async () => {
    try {
      const token = Cookies.get("token");
      clearSession();
      router.push("/login");
      if (token) {
        await axiosAuth.post("/auth/logout");
      }
    } catch (err) {
      console.error("Logout error:", err);
      clearSession();
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    if (!user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);
    return roles.some((r) => r === "ROLE_ADMIN" || r === "ADMIN");
  };

  // Don't render app content until we've run restore (loading === false). This prevents
  // any child from firing an API request before the token is restored from the cookie,
  // which would otherwise get 401 and the axios interceptor would clear the session (F5 logout).
  return (
    <AuthContext.Provider value={{ user, loading, error, login, googleLogin, signup, logout, clearSession, isAdmin }}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-white" aria-label="Loading">
          <div className="w-10 h-10 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default function useAuthContext() {
  return useContext(AuthContext);
}
