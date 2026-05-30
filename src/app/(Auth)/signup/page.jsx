"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaEye, FaEyeSlash } from "react-icons/fa";
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  return (
    <section className="min-h-screen bg-[#DEDEDE] flex items-center justify-center relative overflow-hidden">
      {popupMessage && (
        <div className="absolute top-20 max-w-md w-full mx-4 bg-red-600 text-white font-semibold p-3 rounded-xl shadow-lg z-50 text-center">
          {popupMessage}
        </div>
      )}

      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg z-40 mx-4">
        <h1 className="text-3xl font-bold text-pink-400 text-center mb-4 uppercase">Sign Up</h1>

        {(formError || error) && (
          <p className="bg-red-100 text-red-600 p-3 rounded-md text-center mb-4 font-semibold">
            {formError || error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name Row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-800 block mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={firstName}
                onChange={handleInputChange}
                placeholder="John"
                required
                disabled={isLoading}
                className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition placeholder:text-gray-400 placeholder:opacity-100"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-800 block mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={lastName}
                onChange={handleInputChange}
                placeholder="Son"
                required
                disabled={isLoading}
                className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition placeholder:text-gray-400 placeholder:opacity-100"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-800 block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleInputChange}
              placeholder="example@gmail.com"
              required
              disabled={isLoading}
              className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition placeholder:text-gray-400 placeholder:opacity-100"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                disabled={isLoading}
                className="border p-2 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none w-full pr-10"
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
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                disabled={isLoading}
                className="border p-2 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full p-2 mt-2 font-bold text-xl rounded-lg text-white transition ${isLoading
                ? "bg-pink-300 cursor-not-allowed"
                : "bg-[#F071B4] hover:bg-[#E06AA5] active:scale-[0.98]"
              }`}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

     
        {isLoading && <Loading />}

        <p className="mt-4 text-center text-gray-500 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-[#3C83C1] underline">
            Login
          </Link>
        </p>
      </div>

      <MessageWidget />
    </section>
  );
};

export default Signup;