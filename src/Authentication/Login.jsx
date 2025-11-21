import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaFacebook, FaGoogle } from "react-icons/fa";
import useAuthContext from "./AuthContext";
import Loading from "../Components/Loading/Loading";
import MainImage from "../assets/product_homepage.png";

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, error } = useAuthContext();

  const popupMessage = location.state?.popupMessage || "";
  const redirectTo = location.state?.redirectTo || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const userData = await login({ email, password });

    if (userData) {
      const rolesArray = Array.isArray(userData.roles)
        ? userData.roles
        : [userData.role];

      const isAdmin =
        rolesArray.includes("ROLE_ADMIN") || rolesArray.includes("ADMIN");

      navigate(redirectTo || (isAdmin ? "/dashboard" : "/"));
    }

    setIsLoading(false);
  };

  return (
    <section className="min-h-screen bg-pink-100 flex items-center justify-center relative">

      {popupMessage && (
        <div className="absolute top-20 w-1/3 bg-red-600 text-white font-semibold p-3 rounded-xl shadow-lg z-50 text-center">
          {popupMessage}
        </div>
      )}

      <img
        className="absolute flex flex-col items-center ml-24 mt-[30rem] scale-125 z-0 max-w-full mb-[36rem]"
        src={MainImage}
        alt="Main visual"
      />

      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg z-40">
        <h1 className="text-3xl font-bold text-pink-400 text-center mb-4">
          Login
        </h1>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-pink-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-pink-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          <div className="text-right text-sm">
            <Link to="/forgot-password" className="text-pink-400 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full p-2 mt-2 font-bold rounded-lg text-white transition 
              ${isLoading ? "bg-pink-200 cursor-not-allowed" : "bg-pink-400 hover:bg-pink-500"}`}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="my-4 text-center text-gray-500 text-sm">
          Or continue with
        </div>

        <div className="flex gap-2">
          <button className="flex-1 p-2 rounded-lg text-white font-medium flex items-center justify-center gap-2 bg-blue-600">
            <FaFacebook /> Facebook
          </button>
          <button className="flex-1 p-2 rounded-lg text-white font-medium flex items-center justify-center gap-2 bg-red-600">
            <FaGoogle /> Google
          </button>
        </div>

        <p className="mt-4 text-center text-gray-700">
          Don't have an account?{" "}
          <Link to="/signup" className="text-pink-400 font-bold underline">
            Sign Up
          </Link>
        </p>
      </div>

      {isLoading && <Loading />}
    </section>
  );
};

export default Login;
