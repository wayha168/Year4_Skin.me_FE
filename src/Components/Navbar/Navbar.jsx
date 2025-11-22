import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthContext from "../../Authentication/AuthContext";
import Loading from "../Loading/Loading";
import LoginFirst from "../LoginFirst/LoginFirst"; 

const Navbar = ({ alwaysVisible = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1030);
  const navRef = useRef(null);

  // Resize handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1030);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll hide/show
  useEffect(() => {
    if (alwaysVisible) return;

    let prevScroll = window.scrollY;

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setVisible(prevScroll > currentScroll || currentScroll < 10);
      prevScroll = currentScroll;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [alwaysVisible]);

  // Click outside (close menu)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const safeNavigate = (path, state = null) => {
    setLoading(true);
    if (state) navigate(path, { state });
    else navigate(path);

    setMenuOpen(false);
    setTimeout(() => setLoading(false), 500);
  };

  const loginFirst = new LoginFirst(user, safeNavigate);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    loginFirst.redirectToFavorites();
  };

  const handleBagClick = (e) => {
    e.preventDefault();
    loginFirst.redirectToCart();
  };

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`fixed left-0 w-full bg-[#FFD0ED] shadow-xl transition-all duration-300 z-[9999] h-24 ${
          visible || alwaysVisible ? "top-0" : "-top-32"
        }`}
      >
        <div
          ref={navRef}
          className="max-w-[1280px] mx-auto px-4 flex items-center justify-between h-full"
        >
          {/* BRAND */}
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              safeNavigate("/");
            }}
            className="flex flex-col no-underline select-none"
          >
            <span className="text-[48px] font-bold text-[#eb61a2] leading-none">
              SKIN.ME
            </span>
            <span className="text-[13px] text-black opacity-80">
              @Home Of Your Care
            </span>
          </Link>

          {/* HAMBURGER (MOBILE) */}
          <div
            className="block lg:hidden text-4xl cursor-pointer absolute top-6 right-6"
            onClick={toggleMenu}
          >
            <i className="fa-solid fa-bars"></i>
          </div>

          {/* NAV MENU */}
          <div
          className={`flex gap-6 text-[25px] font-medium max-[1034px]:items-center ${
            menuOpen && isMobile
              ? "flex-col absolute right-0 top-24 bg-[#eac1da] w-1/2 py-4"
              : "hidden lg:flex"
          }`}
          >
            <Link
              to="/"
              onClick={() => safeNavigate("/")}
              className="text-black opacity-80 hover:opacity-60 text-center"
            >
              Home
            </Link>

            <Link
              to="/products"
              onClick={() => safeNavigate("/products")}
              className="text-black opacity-80 hover:opacity-60"
            >
              Products
            </Link>

            <Link
              to="/about-us"
              onClick={() => safeNavigate("/about-us")}
              className="text-black opacity-80 hover:opacity-60"
            >
              About Us
            </Link>
          </div>





          {/* AUTH + ICONS */}
         {/* AUTH + ICONS */}
          <div
            className={`flex items-center gap-4 max-[1024px]:w-1/2 max-[1024px]:-mt-[3rem] max-[1024px]:pb-[1rem] max-[1024px]:rounded-bl-[1rem] ${
              menuOpen && isMobile
                ? "flex-col absolute right-0 bg-[#eac1da] top-[330px] w-full"
                : "hidden lg:flex"
            }`}
          >
            {/* HEART */}
            <Link
              to="/favorites"
              onClick={handleFavoriteClick}
              className="text-5xl text-gray-700 hover:text-blue-500"
            >
              <i className="fa-solid fa-heart"></i>
            </Link>

            {/* BAG */}
            <Link
              to="/bag_page"
              onClick={handleBagClick}
              className="text-5xl text-gray-700 hover:text-blue-500"
            >
              <i className="fa-solid fa-bag-shopping"></i>
            </Link>

            {/* USER LOGGED IN */}
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => safeNavigate("/profile")}
                  className="text-5xl text-gray-700 hover:text-blue-500"
                >
                  <i className="fa-solid fa-user"></i>
                </Link>

                <button
                  onClick={logout}
                  className="px-7 py-3 text-[1.7rem] bg-[#eb61a2] text-white font-semibold rounded-lg hover:bg-[#d0578f]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* LOGIN (conditionally hidden on mobile) */}
                {(!isMobile || (isMobile && menuOpen)) && (
                  <Link
                    to="/login"
                    onClick={() => safeNavigate("/login")}
                    className="px-7 py-3 text-[#ed3b8e] text-[1.5rem] border-2 border-[#ed3b8e] rounded-lg font-bold hover:bg-[#ed3b8e] hover:text-white transition max-[1024px]:absolute max-[1024px]:-top-[16.5rem] max-[1024px]:right-[6rem]"
                  >
                    Login
                  </Link>
                )}

                {/* SIGNUP */}
                <Link
                  to="/signup"
                  onClick={() => safeNavigate("/signup")}
                  className="px-7 py-[0.9rem] text-[1.5rem] border-none bg-[#eb61a2] text-white font-bold rounded-lg hover:bg-[#d0578f]"
                >
                  Sign Up
                </Link>
              </>
            )}
            </div>  
        </div>
      </nav>

      {loading && <Loading />}
    </>
  );
};

export default Navbar;
