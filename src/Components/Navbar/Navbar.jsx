"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useAuthContext from "../../app/lib/Authentication/AuthContext";
import LoginFirst from "../LoginFirst/LoginFirst";
import MessageWidget from "../MessageWidget/MessageWidget";

const Loading = dynamic(() => import("../Loading/Loading"), {
  ssr: false,
});

const Navbar = ({ alwaysVisible = false }) => {
  const router = useRouter();
  const { user, logout } = useAuthContext();

  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const navRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Initialize screen size
  useEffect(() => {
    setIsClient(true);
    setIsMobile(window.innerWidth <= 1030);
    setIsSmallMobile(window.innerWidth <= 510);
  }, []);

  // Resize handler
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth <= 1030);
    setIsSmallMobile(window.innerWidth <= 510);
    if (window.innerWidth > 1030) setMenuOpen(false);
  }, []);

  useEffect(() => {
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };

    window.addEventListener("resize", debouncedResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", debouncedResize);
    };
  }, [handleResize]);

  // Scroll hide/show navbar
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) return;

    scrollTimeoutRef.current = setTimeout(() => {
      const currentScroll = window.scrollY;
      const prevScroll = window.prevScrollY || 0;
      window.prevScrollY = currentScroll;
      
      // Show navbar when scrolling up OR at top of page
      setVisible(currentScroll < prevScroll || currentScroll < 10);
      scrollTimeoutRef.current = null;
    }, 100);
  }, []);

  useEffect(() => {
    window.prevScrollY = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [handleScroll]);

  // Close menu when clicking outside
  const handleClickOutside = useCallback((e) => {
    if (navRef.current && !navRef.current.contains(e.target)) {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside, menuOpen]);

  // Helpers
  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
  const safeNavigate = useCallback(
    (path) => {
      setLoading(true);
      router.push(path);
      setMenuOpen(false);
      setTimeout(() => setLoading(false), 500);
    },
    [router]
  );

  const loginFirst = useMemo(() => new LoginFirst(user, safeNavigate), [
    user,
    safeNavigate,
  ]);

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
      {/* NORMAL NAVBAR */}
      <nav
        className={`fixed left-0 w-full bg-[#FFD0ED] shadow-xl transition-all duration-300 z-[9999] h-24 ${
          visible ? "top-0" : "-top-32"
        }`}
      >
        <div
          ref={navRef}
          className="max-w-[1280px] mx-auto px-4 flex items-center justify-between h-full"
        >
          {/* BRAND */}
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              safeNavigate("/");
            }}
            className={`flex flex-col no-underline select-none ${
              isSmallMobile ? "mx-auto" : ""
            }`}
          >
            <span className="text-[48px] font-bold text-[#eb61a2] leading-none">
              SKIN.ME
            </span>
            <span className="text-[13px] text-black opacity-80">
              @Home Of Your Care
            </span>
          </Link>

          {/* HAMBURGER (HIDDEN IF SMALL MOBILE) */}
          {!isSmallMobile && (
            <div
              className="block lg:hidden text-4xl cursor-pointer absolute top-6 right-6"
              onClick={toggleMenu}
            >
              <i className="fa-solid fa-bars"></i>
            </div>
          )}

          {/* MENU */}
          {!isSmallMobile && (
            <div
              className={`flex gap-6 text-[25px] font-medium max-[1034px]:items-center ${
                menuOpen && isMobile
                  ? "flex-col absolute right-0 top-24 bg-[#eac1da] w-1/2 py-4"
                  : "hidden lg:flex"
              }`}
            >
              <Link
                href="/"
                onClick={() => safeNavigate("/")}
                className="text-black opacity-80 hover:opacity-60"
              >
                Home
              </Link>

              <Link
                href="/products"
                onClick={() => safeNavigate("/products")}
                className="text-black opacity-80 hover:opacity-60"
              >
                Products
              </Link>

              <Link
                href="/about-us"
                onClick={() => safeNavigate("/about-us")}
                className="text-black opacity-80 hover:opacity-60"
              >
                About Us
              </Link>
            </div>
          )}

          {/* AUTH + ICONS */}
          {!isSmallMobile && (
            <div
              className={`flex items-center gap-4 ${
                menuOpen && isMobile
                  ? "flex-col absolute right-0 bg-[#eac1da] top-[330px] w-full"
                  : "hidden lg:flex"
              }`}
            >
              {/* HEART */}
              <Link
                href="/favorites"
                onClick={handleFavoriteClick}
                className="text-5xl text-gray-700 hover:text-blue-500"
              >
                <i className="fa-solid fa-heart"></i>
              </Link>

              {/* BAG */}
              <Link
                href="/bag_page"
                onClick={handleBagClick}
                className="text-5xl text-gray-700 hover:text-blue-500"
              >
                <i className="fa-solid fa-bag-shopping"></i>
              </Link>

              {/* AUTH */}
              {user ? (
                <>
                  <Link
                    href="/profile"
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
                  <Link
                    href="/login"
                    onClick={() => safeNavigate("/login")}
                    className="px-7 py-3 text-[#ed3b8e] text-[1.5rem] border-2 border-[#ed3b8e] rounded-lg font-bold hover:bg-[#ed3b8e] hover:text-white transition"
                  >
                    Login
                  </Link>

                  <Link
                    href="/signup"
                    onClick={() => safeNavigate("/signup")}
                    className="px-7 py-[0.9rem] text-[1.5rem] bg-[#eb61a2] text-white font-bold rounded-lg hover:bg-[#d0578f]"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* 🚀 SMALL MOBILE BOTTOM NAVBAR (< 510px) */}
      {isSmallMobile && (
        <div className="fixed bottom-0 left-0 w-full bg-[#FFD0ED] h-20 shadow-xl z-[99999] flex justify-around items-center text-5xl text-gray-700">
          <i
            className="fa-solid fa-circle-info cursor-pointer hover:text-[#eb61a2] transition-colors"
            onClick={() => safeNavigate("/about-us")}
          ></i>

          <i
            className="fa-solid fa-shop text-[2.6rem] cursor-pointer hover:text-[#eb61a2] transition-colors"
            onClick={() => safeNavigate("/products")}
          ></i>

          <i
            className="fa-solid fa-house cursor-pointer hover:text-[#eb61a2] transition-colors"
            onClick={() => safeNavigate("/")}
          ></i>

          

          <i
            className="fa-solid fa-heart cursor-pointer hover:text-[#eb61a2] transition-colors"
            onClick={handleFavoriteClick}
          ></i>

          <i
            className="fa-solid fa-bag-shopping cursor-pointer hover:text-[#eb61a2] transition-colors"
            onClick={handleBagClick}
          ></i>

          {user ? (
            <i
              className="fa-solid fa-user cursor-pointer hover:text-[#eb61a2] transition-colors"
              onClick={() => safeNavigate("/profile")}
            ></i>
          ) : (
            <i
              className="fa-solid fa-right-to-bracket cursor-pointer hover:text-[#eb61a2] transition-colors"
              onClick={() => safeNavigate("/login")}
            ></i>
          )}
        </div>
      )}

      {loading && <Loading />}
      <MessageWidget/>
    </>
  );
};

export default Navbar;