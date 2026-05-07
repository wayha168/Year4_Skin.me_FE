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
    <section className="min-h-screen bg-[#CCF6F2] flex items-center justify-center relative overflow-hidden">
      {popupMessage && (
        <div className="absolute top-20 max-w-md w-full mx-4 bg-red-600 text-white font-semibold p-3 rounded-xl shadow-lg z-50 text-center">
          {popupMessage}
        </div>
      )}

      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg z-40 mx-4">
        <h1 className="text-3xl font-bold text-pink-400 text-center mb-4 uppercase">Sign Up</h1>

        {(formError || error) && (
          <p className="bg-red-100 text-red-600 p-3 rounded-md text-center mb-4 font-semibold">{formError || error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name Row */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <div>
              <label className="text-sm font-medium text-gray-800 block mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={firstName}
                onChange={handleInputChange}
                placeholder="John"
                required
                disabled={isLoading}
                className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition placeholder:text-gray-400 placeholder:opacity-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800 block mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={lastName}
                onChange={handleInputChange}
                placeholder="Son"
                required
                disabled={isLoading}
                className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition placeholder:text-gray-400 placeholder:opacity-100"
              />
            </div>
          </div>

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
              className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition placeholder:text-gray-400 placeholder:opacity-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleInputChange}
              placeholder="Example1234"
              required
              disabled={isLoading}
              className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition placeholder:text-gray-400 placeholder:opacity-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleInputChange}
              placeholder="Example1234"
              required
              disabled={isLoading}
              className="w-full p-2 border border-gray-400 rounded-lg outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition placeholder:text-gray-400 placeholder:opacity-100"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full p-2 mt-2 font-bold text-xl rounded-lg text-white transition ${isLoading ? "bg-pink-300 cursor-not-allowed" : "bg-[#F071B4] hover:bg-[#E06AA5] active:scale-[0.98]"
              }`}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-500 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-[#3C83C1] underline">
            Login
          </Link>
        </p>
      </div>

      {isLoading && <Loading />}

      <MessageWidget />
    </section>
  );
};

export default Signup;
