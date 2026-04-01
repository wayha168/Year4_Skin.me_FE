"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FaGoogle } from "react-icons/fa";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import useAuthContext from "../../../app/lib/Authentication/AuthContext";
import axiosAuth from "../../../app/lib/api/axiosConfig";
import Loading from "../../../Components/Loading/Loading";
import Image from "next/image";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";
import { getGoogleOAuthRedirectUri } from "../../../app/lib/Authentication/googleOAuthRedirect";

function doRedirect(router, redirectTo, userData) {
  const rolesArray = Array.isArray(userData?.roles) ? userData.roles : [userData?.role].filter(Boolean);
  const isAdmin = rolesArray.includes("ROLE_ADMIN") || rolesArray.includes("ADMIN");
  router.push(redirectTo || (isAdmin ? "/dashboard" : "/"));
}

function LoginForm({ onGoogleClick, isGoogleLoading }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error } = useAuthContext();

  const popupMessage = searchParams.get("message") || "";
  const redirectTo = searchParams.get("redirect") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userData = await login({ email, password });
      if (userData) doRedirect(router, redirectTo, userData);
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isLoading || isGoogleLoading;

  return (
    <>
      {popupMessage && (
        <div className="absolute top-20 max-w-md w-full mx-4 bg-red-600 text-white font-semibold p-3 rounded-xl shadow-lg z-50 text-center">
          {popupMessage}
        </div>
      )}

      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg z-40 mx-4">
        <h1 className="text-3xl font-bold text-pink-400 text-center mb-4 uppercase">Login</h1>

        {error && (
          <p className="bg-red-100 text-red-600 p-3 rounded-md text-center mb-4 font-semibold">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition"
            />
          </div>

          <div className="text-right text-sm">
            <Link href="/forgot-password" className="text-pink-400 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 mt-2 font-bold rounded-lg text-white transition ${loading ? "bg-pink-300 cursor-not-allowed" : "bg-pink-400 hover:bg-pink-500 active:scale-[0.98]"
              }`}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="my-4 text-center text-gray-500 text-sm">Or continue with</div>

        {onGoogleClick ? (
          <button
            type="button"
            onClick={onGoogleClick}
            disabled={loading}
            className="w-full p-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 bg-[#4285f4] hover:bg-[#357ae8] transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <FaGoogle /> Continue with Google
          </button>
        ) : (
          <p className="text-center text-gray-500 text-sm">
            Add <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to .env to enable Google login.
          </p>
        )}

        {loading && <Loading />}

        <p className="mt-4 text-center text-gray-700">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-pink-400 font-bold underline hover:text-pink-500">
            Sign Up
          </Link>
        </p>
      </div>
    </>
  );
}

function LoginFormWithGoogle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { googleLogin, setLoginError } = useAuthContext();
  const redirectTo = searchParams.get("redirect") || "";
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // One auth code = one exchange; block duplicate onSuccess (e.g. dev Strict Mode) from reusing the same code.
  const googleExchangeInFlight = useRef(false);

  const googleOAuthRedirectUri = useMemo(() => getGoogleOAuthRedirectUri(), []);

  const loginWithGoogle = useGoogleLogin({
    flow: "auth-code",
    redirect_uri: googleOAuthRedirectUri,
    onSuccess: async (res) => {
      if (!res?.code) return;
      if (googleExchangeInFlight.current) return;
      googleExchangeInFlight.current = true;
      setLoginError("");
      setIsGoogleLoading(true);
      try {
        const userData = await googleLogin(res.code, googleOAuthRedirectUri);
        if (userData) doRedirect(router, redirectTo, userData);
      } catch (err) {
        console.error("Google login error:", err);
      } finally {
        setIsGoogleLoading(false);
        googleExchangeInFlight.current = false;
      }
    },
    onError: () => {
      setIsGoogleLoading(false);
      setLoginError("Unable to sign in with Google. Please try again.");
    },
    onNonOAuthError: () => {
      setIsGoogleLoading(false);
    },
  });

  return (
    <LoginForm
      onGoogleClick={() => {
        setLoginError("");
        loginWithGoogle();
      }}
      isGoogleLoading={isGoogleLoading}
    />
  );
}

const Login = () => {
  const MainImage = "/assets/product_homepage.png";
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const { user, loading, clearSession } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifyDone, setVerifyDone] = useState(false);

  // When we have user (e.g. after 401 redirect without clear), verify token. If invalid, clear so we show login form.
  useEffect(() => {
    if (loading || !user || verifyDone) return;
    let cancelled = false;
    (async () => {
      try {
        await axiosAuth.get("/users/user-profile");
        if (cancelled) return;
        setVerifyDone(true);
        const redirectTo = searchParams.get("redirect") || "";
        const rolesArray = Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean);
        const isAdmin = rolesArray.includes("ROLE_ADMIN") || rolesArray.includes("ADMIN");
        router.replace(redirectTo || (isAdmin ? "/dashboard" : "/"));
      } catch (err) {
        if (cancelled) return;
        if (err?.response?.status === 401) {
          clearSession();
        }
        setVerifyDone(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, loading, clearSession, router, searchParams, verifyDone]);

  if (user && !verifyDone) {
    return (
      <section className="min-h-screen bg-pink-100 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" aria-label="Verifying" />
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-pink-100 flex items-center justify-center relative overflow-hidden">
      <Image
        className="absolute left-0 bottom-0 opacity-20 pointer-events-none"
        src={MainImage}
        alt="Main visual"
        width={600}
        height={600}
        priority
        style={{ width: "auto", height: "auto" }}
      />

      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          <LoginFormWithGoogle />
        </GoogleOAuthProvider>
      ) : (
        <LoginForm />
      )}

      <MessageWidget />
    </section>
  );
};

export default Login;
