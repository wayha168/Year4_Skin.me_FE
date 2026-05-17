"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import useAuthContext from "../../lib/Authentication/AuthContext";
import Loading from "../../../Components/Loading/Loading";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";

const Signup = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup, error } = useAuthContext();

  // Get query parameters properly
  const popupMessage = searchParams.get("message") || "";
  const redirectTo = searchParams.get("redirect") || "";

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case "firstName":
        setFirstName(value);
        break;
      case "lastName":
        setLastName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Simple validation
    if (!firstName.trim() || !lastName.trim()) {
      setFormError("Please fill in your first and last name.");
      return;
    }
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const userData = await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (userData) {
        const roles = Array.isArray(userData.roles) ? userData.roles : [userData.role];
        const isAdmin = roles.includes("ROLE_ADMIN") || roles.includes("ADMIN");

        router.push(redirectTo || (isAdmin ? "/dashboard" : "/"));
      }
    } catch (err) {
      console.error(err);
      setFormError(error || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const MainImage = "/assets/product_homepage.png";

  return (
    <section className="min-h-screen bg-pink-100 flex items-center justify-center p-6 relative overflow-hidden">
      {popupMessage && (
        <div className="absolute top-6 z-50 bg-pink-100 border border-pink-300 text-pink-600 font-semibold px-4 py-2 rounded-lg shadow">
          {popupMessage}
        </div>
      )}

      {/* Background Image */}
      <img
        src={MainImage}
        alt="background"
        className="absolute right-20 top-20 scale-110 opacity-30 max-w-3xl hidden sm:block pointer-events-none"
      />

      {/* Card */}
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-lg shadow-lg rounded-lg p-8 z-20 border border-black/5">
        <h1 className="text-3xl font-bold text-center text-pink-500 mb-6">Sign Up</h1>

        {(formError || error) && (
          <p className="bg-red-100 text-red-600 p-3 rounded-md font-semibold text-center mb-3">
            {formError || error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name Row */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex flex-col w-full">
              <label className="text-sm font-semibold text-gray-700">First Name</label>
              <input
                type="text"
                name="firstName"
                value={firstName}
                onChange={handleInputChange}
                placeholder="First Name"
                disabled={isLoading}
                className="border p-2 rounded-md focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none"
              />
            </div>

            <div className="flex flex-col w-full">
              <label className="text-sm font-semibold text-gray-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={lastName}
                onChange={handleInputChange}
                placeholder="Last Name"
                disabled={isLoading}
                className="border p-2 rounded-md focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              disabled={isLoading}
              className="border p-2 rounded-md focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              disabled={isLoading}
              className="border p-2 rounded-md focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none"
            />
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              disabled={isLoading}
              className="border p-2 rounded-md focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-md font-bold text-white transition ${
              isLoading
                ? "bg-pink-300 cursor-not-allowed"
                : "bg-pink-500 hover:bg-pink-600 active:scale-[0.98]"
            }`}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-gray-700 font-semibold mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-pink-500 font-bold underline">
            Login
          </Link>
        </p>
      </div>

      {isLoading && <Loading />}
      <MessageWidget/>
    </section>
  );
};

export default Signup;
