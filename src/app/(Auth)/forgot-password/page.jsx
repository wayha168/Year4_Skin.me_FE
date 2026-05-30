"use client";

import { useState } from "react";
import Link from "next/link";
import { API_BASE } from "../../lib/api/config";
import Loading from "../../../Components/Loading/Loading";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";

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

  return (
    <section className="min-h-screen bg-[#DEDEDE] flex items-center justify-center relative overflow-hidden">
      {message && (
        <div className={`absolute top-20 max-w-md w-full mx-4 p-3 rounded-xl shadow-lg z-50 text-center font-semibold ${
          isError ? "bg-red-600 text-white" : "bg-green-600 text-white"
        }`}>
          {message}
        </div>
      )}

      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg z-40 mx-4">
        <h1 className="text-3xl font-bold text-pink-400 text-center mb-4 uppercase">Forgot Password</h1>
        <p className="text-gray-600 text-sm text-center mb-4">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

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
              disabled={isLoading}
              className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition placeholder:text-gray-400 placeholder:opacity-100"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full p-2 mt-2 font-bold text-xl rounded-lg text-white transition ${isLoading 
                ? "bg-pink-300 cursor-not-allowed" 
                : "bg-[#F071B4] hover:bg-[#E06AA5] active:scale-[0.98]"
              }`}
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-500 text-sm">
          <Link href="/login" className="text-[#3C83C1] underline">
            Back to Login
          </Link>
        </p>
      </div>

      {isLoading && <Loading />}

      <MessageWidget />
    </section>
  );
}
