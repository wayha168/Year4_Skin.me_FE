import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthContext from "../../Authentication/AuthContext";
import Loading from "../Loading/Loading";
import "./Navbar.css";
import LoginFirst from "../LoginFirst/LoginFirst"; // OOP class for login redirection logic

const Navbar = ({ alwaysVisible = false }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  // ---------- UI State ----------
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1030);
  const navRef = useRef(null);

  // ---------- Handle Window Resize ----------
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1030);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---------- Navbar Show/Hide on Scroll (fixed) ----------
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

  // ---------- Click Outside Closes Menu ----------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------- Menu Toggle ----------
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // ---------- Logout ----------
  const handleLogout = () => logout();

  // ---------- Safe Navigation with Loading ----------
  const safeNavigate = (path, state = null) => {
    setLoading(true);
    if (state) navigate(path, { state });
    else navigate(path);
    setMenuOpen(false);
    setTimeout(() => setLoading(false), 500);
  };

  // ---------- Instantiate OOP Login Redirect Handler ----------
  const loginFirst = new LoginFirst(user, safeNavigate);

  // ---------- Redirect Handlers ----------
  const handleFavoriteClick = (e) => {
    e.preventDefault();
    loginFirst.redirectToFavorites(); // handled by OOP
  };

  const handleBagClick = (e) => {
    e.preventDefault();
    loginFirst.redirectToCart(); // handled by OOP
  };

  return (
    <>
      <nav
        className="navbar-wrapper"
        style={{ top: visible || alwaysVisible ? "0" : "-100px" }}
      >
        <div className="navbar-content" ref={navRef}>
          {/* ---------- Brand ---------- */}
          <Link
            to="/"
            className="brand-logo"
            onClick={(e) => {
              e.preventDefault();
              safeNavigate("/");
            }}
          >
            <span className="main-brand-name  ">SKIN.ME</span>
            <span className="brand-tagline">@Home Of Your Care</span>
          </Link>

          {/* ---------- Hamburger Menu ---------- */}
          <div className="main-dropdown" onClick={toggleMenu}>
            <i className="fa-solid fa-bars"></i>
          </div>

          {/* ---------- Navigation Links ---------- */}
          <div className={`nav-menu ${menuOpen ? "active" : ""}`}>
            <Link
              to="/"
              onClick={() => safeNavigate("/")}
              className="nav-item home"
            >
              Home
            </Link>
            <Link
              to="/products"
              onClick={() => safeNavigate("/products")}
              className="nav-item product"
            >
              Products
            </Link>
            <Link
              to="/about-us"
              onClick={() => safeNavigate("/about-us")}
              className="nav-item about_us"
            >
              About Us
            </Link>
          </div>

          {/* ---------- Auth / User Menu ---------- */}
          <div className={`auth-menu ${menuOpen ? "active" : ""}`}>
            {/* Favorite (uses OOP redirect) */}
            <Link
              to="/favorites"
              onClick={handleFavoriteClick}
              className="icons nav-icon favorite"
            >
              <i className="fa-solid fa-heart" />
            </Link>

            {/* Bag (uses OOP redirect) */}
            <Link
              to="/bag_page"
              onClick={handleBagClick}
              className="icons nav-icon bag"
            >
              <i className="fa-solid fa-bag-shopping" />
            </Link>

            {/* ---------- User Logged In ---------- */}
            {user && (
              <>
                <Link
                  to="/profile"
                  onClick={() => safeNavigate("/profile")}
                  className="icons nav-icon"
                >
                  <i className="fa-solid fa-user" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="auth_button logout_button"
                >
                  Logout
                </button>
              </>
            )}

            {/* ---------- User Not Logged In ---------- */}
            {!user && (
              <>
                {(!isMobile || (isMobile && menuOpen)) && (
                  <Link
                    to="/login"
                    onClick={() => safeNavigate("/login")}
                    className="auth-button login-button"
                  >
                    Login
                  </Link>
                )}
                <Link
                  to="/signup"
                  onClick={() => safeNavigate("/signup")}
                  className="auth-button signup-button"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ---------- Loading Indicator ---------- */}
      {loading && <Loading />}
    </>
  );
};

export default Navbar;
