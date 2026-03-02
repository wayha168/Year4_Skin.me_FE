"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { API_BASE } from "../../lib/api/config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const url = `${API_BASE}/auth/forgot-password?email=${encodeURIComponent(email.trim())}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMessage(
          data?.message ||
            "If an account exists for this email, we sent you a link. Check your inbox and click the link to set a new password."
        );
        setIsError(false);
      } else {
        setMessage(data?.message || "Something went wrong. Please try again.");
        setIsError(true);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setMessage("Network error. Please try again.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const mainImage = "/assets/product_homepage.png";

  return (
    <section className="min-h-screen bg-pink-100 flex items-center justify-center relative overflow-hidden">
      <Image
        className="absolute left-0 bottom-0 opacity-20 pointer-events-none"
        src={mainImage}
        alt=""
        width={600}
        height={600}
        priority
        style={{ width: "auto", height: "auto" }}
      />

      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg z-40 mx-4">
        <h1 className="text-3xl font-bold text-pink-400 text-center mb-2 uppercase">Forgot Password</h1>
        <p className="text-gray-600 text-sm text-center mb-4">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {message && (
          <p
            className={`p-3 rounded-md text-center mb-4 font-semibold ${
              isError ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </p>
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
              disabled={isLoading}
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full p-3 mt-2 font-bold rounded-lg text-white transition ${
              isLoading ? "bg-pink-300 cursor-not-allowed" : "bg-pink-400 hover:bg-pink-500 active:scale-[0.98]"
            }`}
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-700">
          <Link href="/login" className="text-pink-400 font-bold underline hover:text-pink-500">
            Back to Login
          </Link>
        </p>
      </div>
    </section>
  );
}
