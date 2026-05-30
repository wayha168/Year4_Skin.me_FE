"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import axiosAuth from "../../lib/api/axiosConfig";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [success, setSuccess] = useState(false);

  const hasValidParams = token && email;

  useEffect(() => {
    if (!hasValidParams) {
      setMessage("Invalid or missing reset link. Request a new link from the Forgot Password page.");
      setIsError(true);
    }
  }, [hasValidParams]);

   const handleSubmit = async (e) => {
     e.preventDefault();
     if (!hasValidParams || !password.trim() || password !== confirmPassword) {
       setMessage("Passwords do not match.");
       setIsError(true);
       return;
     }
     setIsLoading(true);
     setMessage(null);
     setIsError(false);

      try {
        const params = new URLSearchParams({
          email: email.trim(),
          token: token.trim(),
          password: password.trim(),
          confirmPassword: confirmPassword.trim(),
        });
        const res = await axiosAuth.post(`/auth/reset-password?${params.toString()}`);
        const data = res.data;

        if (res.status === 200) {
          setMessage(data?.message || "Your password has been reset. You can now log in.");
          setSuccess(true);
          setIsError(false);
        } else {
          setMessage(data?.message || "Reset failed. The link may have expired. Request a new one.");
          setIsError(true);
        }
      } catch (err) {
        console.error("Reset password error:", err);
        const message = err.response?.data?.message || err.message || "Network error. Please try again.";
        setMessage(message);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
   };

  const mainImage = "/assets/product_homepage.png";

  if (!hasValidParams) {
    return (
      <section className="min-h-screen bg-[#CCF6F2] flex items-center justify-center relative overflow-hidden">
        <Image
          className="absolute left-0 bottom-0 opacity-20 pointer-events-none"
          src={mainImage}
          alt=""
          width={600}
          height={600}
          style={{ width: "auto", height: "auto" }}
        />
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg z-40 mx-4">
          <h1 className="text-3xl font-bold text-blue-600 text-center mb-4 uppercase">Reset Password</h1>
          {message && (
            <p className="bg-red-100 text-red-600 p-3 rounded-md text-center mb-4 font-semibold">{message}</p>
          )}
          <p className="text-center">
            <Link href="/forgot-password" className="text-pink-400 font-bold underline hover:text-pink-500">
              Get a new reset link
            </Link>
            {" · "}
            <Link href="/login" className="text-pink-400 font-bold underline hover:text-pink-500">
              Back to Login
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-pink-100 flex items-center justify-center relative overflow-hidden">
      <Image
        className="absolute left-0 bottom-0 opacity-20 pointer-events-none"
        src={mainImage}
        alt=""
        width={600}
        height={600}
        style={{ width: "auto", height: "auto" }}
      />

      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg z-40 mx-4">
        <h1 className="text-3xl font-bold text-blue-600 text-center mb-4 uppercase">Set new password</h1>
        <p className="text-gray-600 text-sm text-center mb-4">
          Enter your new password below. Use the same password in both fields.
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

        {!success && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">New password</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                disabled={isLoading}
                className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition placeholder:text-gray-400 placeholder:opacity-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Confirm new password</label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                disabled={isLoading}
                className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition placeholder:text-gray-400 placeholder:opacity-100"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full p-2 mt-2 font-bold text-xl rounded-lg text-white transition ${
                isLoading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
              }`}
            >
              {isLoading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        {success && (
          <p className="text-center">
            <Link href="/login" className="text-pink-400 font-bold underline hover:text-pink-500">
              Go to Login
            </Link>
          </p>
        )}

        {!success && (
          <p className="mt-4 text-center text-gray-700">
            <Link href="/login" className="text-pink-400 font-bold underline hover:text-pink-500">
              Back to Login
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
