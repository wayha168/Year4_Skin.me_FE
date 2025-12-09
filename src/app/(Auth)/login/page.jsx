"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FaFacebook, FaGoogle } from "react-icons/fa";
import useAuthContext from "../../../app/lib/Authentication/AuthContext";
import Loading from "../../../Components/Loading/Loading";
import Image from "next/image";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";

const Login = () => {
  const MainImage = "/assets/product_homepage.png";

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error } = useAuthContext();

  // Correct useSearchParams usage
  const popupMessage = searchParams.get("message") || "";
  const redirectTo = searchParams.get("redirect") || "";

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData = await login({ email, password });

      if (userData) {
        const rolesArray = Array.isArray(userData.roles) ? userData.roles : [userData.role];
        const isAdmin = rolesArray.includes("ROLE_ADMIN") || rolesArray.includes("ADMIN");

        router.push(redirectTo || (isAdmin ? "/dashboard" : "/"));
      }
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-pink-100 flex items-center justify-center relative overflow-hidden">
      {popupMessage && (
        <div className="absolute top-20 max-w-md w-full mx-4 bg-red-600 text-white font-semibold p-3 rounded-xl shadow-lg z-50 text-center">
          {popupMessage}
        </div>
      )}

      {/* Background Image */}
      <Image
        className="absolute left-0 bottom-0 opacity-20 pointer-events-none"
        src={MainImage}
        alt="Main visual"
        width={600}
        height={600}
        priority
      />

      {/* Card */}
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg z-40 mx-4">
        <h1 className="text-3xl font-bold text-pink-400 text-center mb-4">Login</h1>

        {error && (
          <p className="bg-red-100 text-red-600 p-3 rounded-md text-center mb-4 font-semibold">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition"
            />
          </div>

          <div className="text-right text-sm">
            <Link href="/forgot-password" className="text-pink-400 hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full p-3 mt-2 font-bold rounded-lg text-white transition ${
              isLoading
                ? "bg-pink-300 cursor-not-allowed"
                : "bg-pink-400 hover:bg-pink-500 active:scale-[0.98]"
            }`}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="my-4 text-center text-gray-500 text-sm">Or continue with</div>

        {/* Social Buttons */}
        <div className="flex gap-2">
          <button
            className="flex-1 p-2 rounded-lg text-white font-medium flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 transition"
            disabled={isLoading}
          >
            <FaFacebook /> Facebook
          </button>
          <button
            className="flex-1 p-2 rounded-lg text-white font-medium flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 transition"
            disabled={isLoading}
          >
            <FaGoogle /> Google
          </button>
        </div>

        <p className="mt-4 text-center text-gray-700">
          Don't have an account?{" "}
          <Link href="/signup" className="text-pink-400 font-bold underline hover:text-pink-500">
            Sign Up
          </Link>
        </p>
      </div>

      {isLoading && <Loading />}
      <MessageWidget/>
    </section>
  );
};

export default Login;
