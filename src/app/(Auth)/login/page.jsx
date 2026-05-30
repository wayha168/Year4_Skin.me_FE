"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
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
  const [showPassword, setShowPassword] = useState(false);
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
            <label className="text-sm font-medium text-gray-800 block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              required
              disabled={loading}
              className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition placeholder:text-gray-400 placeholder:opacity-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Example1234"
                required
                disabled={loading}
                className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition placeholder:text-gray-400 placeholder:opacity-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            <div className="text-right mt-1">
              <Link href="/forgot-password" className="text-[#3C83C1] underline text-sm">
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-2 mt-2 font-bold text-xl rounded-lg text-white transition ${loading
                ? "bg-pink-300 cursor-not-allowed"
                : "bg-[#F071B4] hover:bg-[#E06AA5] active:scale-[0.98]"
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
            className="w-full p-2 rounded-lg text-white font-bold text-xl flex items-center justify-center gap-2 bg-[#F071B4] hover:bg-[#E06AA5] transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <FaGoogle /> Continue with Google
          </button>
        ) : (
          <p className="text-center text-gray-500 text-sm">
            Add <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to .env to
            enable Google login.
          </p>
        )}

        {loading && <Loading />}

        <p className="mt-4 text-center text-gray-500 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#3C83C1] underline">
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
  const { googleLogin } = useAuthContext();
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI || "postmessage";
  const redirectTo = searchParams.get("redirect") || "";
const [isGoogleLoading, setIsGoogleLoading] = useState(false);
   const [loginError, setLoginError] = useState("");
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
        const userData = await googleLogin(res.code, redirectUri);
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
     <>
       {loginError && (
         <p className="bg-red-100 text-red-600 p-3 rounded-md text-center mb-4 font-semibold">
           {loginError}
         </p>
       )}
       <LoginForm onGoogleClick={() => loginWithGoogle()} isGoogleLoading={isGoogleLoading} />
     </>
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
    return () => {
      cancelled = true;
    };
  }, [user, loading, clearSession, router, searchParams, verifyDone]);

  if (user && !verifyDone) {
    return (
      <section className="min-h-screen bg-[#CCF6F2] flex items-center justify-center">
        <div
          className="w-10 h-10 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"
          aria-label="Verifying"
        />
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#DEDEDE] flex items-center justify-center relative overflow-hidden">
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
