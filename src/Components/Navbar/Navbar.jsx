"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useAuthContext from "../../app/lib/Authentication/AuthContext";
import LoginFirst from "../LoginFirst/LoginFirst";
import MessageWidget from "../MessageWidget/MessageWidget";
import axiosAuth from "../../app/lib/api/axiosConfig";
import { getProductImageUrl } from "../../app/lib/productImage";

const Loading = dynamic(() => import("../Loading/Loading"), {
  ssr: false,
});

const Navbar = ({ alwaysVisible = false }) => {
  const router = useRouter();
  const { user } = useAuthContext();

  const [translateY, setTranslateY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isTinyMobile, setIsTinyMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchProducts, setSearchProducts] = useState([]);
  const [searchProductsLoading, setSearchProductsLoading] = useState(false);

  const navRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  // Initialize screen size
  useEffect(() => {
    setIsClient(true);
    setIsMobile(window.innerWidth <= 1030);
    setIsSmallMobile(window.innerWidth <= 510);
    setIsTinyMobile(window.innerWidth <= 770);
  }, []);

  // Resize handler
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth <= 1030);
    setIsSmallMobile(window.innerWidth <= 510);
    setIsTinyMobile(window.innerWidth <= 770);
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

  // Scroll behavior: smooth hide/show based on scroll speed
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY;
          // Adjust translateY based on scroll delta for both directions
          setTranslateY(prev => Math.max(-80, Math.min(0, prev - delta)));
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [translateY]);

  // Close menu and search when clicking outside
  const handleClickOutside = useCallback((e) => {
    if (navRef.current && !navRef.current.contains(e.target)) {
      setMenuOpen(false);
      setSearchOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside, menuOpen, searchOpen]);

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

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.();
    const q = searchQuery?.trim();
    if (q) {
      safeNavigate(`/products?search=${encodeURIComponent(q)}`);
      setSearchQuery("");
      setSearchOpen(false);
    } else {
      safeNavigate("/products");
      setSearchOpen(false);
    }
  };

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  // Fetch products when search opens (for results dropdown)
  useEffect(() => {
    if (!searchOpen || isSmallMobile) return;
    setSearchProductsLoading(true);
    axiosAuth
      .get("/products/all")
      .then((res) => setSearchProducts(res?.data?.data || []))
      .catch(() => setSearchProducts([]))
      .finally(() => setSearchProductsLoading(false));
  }, [searchOpen, isSmallMobile]);

  // Filter products by name or brand – only show results after user types
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const term = searchQuery.toLowerCase().trim();
    const getBrand = (p) =>
      typeof p?.brand === "string" ? p.brand : p?.brand?.name;
    return searchProducts
      .filter(
        (p) =>
          p?.name?.toLowerCase().includes(term) ||
          getBrand(p)?.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [searchProducts, searchQuery]);

  const goToProduct = useCallback(
    (productId) => {
      setSearchOpen(false);
      setSearchQuery("");
      safeNavigate(`/product_details?productId=${productId}`);
    },
    [safeNavigate]
  );

  return (
    <>
      {/* NORMAL NAVBAR */}
      <nav
        className={`fixed left-0 w-full bg-white shadow-xl transition-transform duration-50 ease-out z-[9999] h-20`}
        style={{ transform: `translateY(${translateY}px)` }}
      >
        <div
          ref={navRef}
          className="max-w-[1280px] mx-auto pl-[13px] pr-4 flex items-center justify-between h-full relative"
        >
          {/* LEFT: Logo */}
          {!searchOpen && (
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                if (window.location.pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  safeNavigate("/");
                }
              }}
              className="flex flex-col items-start no-underline select-none text-[#eb61a2] flex-shrink-0 max-[770px]:items-center max-[770px]:w-full"
            >
              <span className="text-[40px] font-bold tracking-tight leading-none uppercase" style={{ fontSize: '40px' }}>
                SKIN.ME
              </span>
              <span className="text-[10px] opacity-90 mt-0.5 tracking-wide text-black">
                @Home Of Your Care
              </span>
            </Link>
          )}

          {/* CENTER: Nav icons (Home, Products, About Us) */}
          {!isSmallMobile && !searchOpen && !isTinyMobile && (
            <div
              className={`flex items-center gap-11 max-[1000px]:-ml-16 ${menuOpen && isMobile
                ? "flex-col absolute left-4 top-16 bg-white py-4 rounded-lg z-10 px-6"
                : "absolute left-1/2 -translate-x-1/2"
                }`}
            >
              <Link
                href="/"
                onClick={() => safeNavigate("/")}
                className="text-black/80 hover:text-[#eb61a2] transition-none p-0"
                title="Home"
              >
                <Image src="/assets/NavbarIcons/Icons Home.svg" alt="Home" width={38} height={38} />
              </Link>
              <Link
                href="/products"
                onClick={() => safeNavigate("/products")}
                className="text-black/80 hover:text-[#eb61a2] transition-none p-0"
                title="Products"
              >
                <Image src="/assets/NavbarIcons/Icons Products.svg" alt="Products" width={38} height={38} />
              </Link>
              <Link
                href="/about-us"
                onClick={() => safeNavigate("/about-us")}
                className="text-black/80 hover:text-[#eb61a2] transition-none p-0"
                title="About Us"
              >
                <Image src="/assets/NavbarIcons/Icons About Us.svg" alt="About Us" width={38} height={38} />
              </Link>
            </div>
          )}

          {searchOpen && !isSmallMobile && (
            <div
              ref={searchResultsRef}
              className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full max-w-xl px-4 z-20"
            >
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 shadow-lg pl-[15px] pr-2 py-2.5 min-h-[48px]"
              >
                <i className="fa-solid fa-magnifying-glass text-gray-500 text-xl"></i>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or brand..."
                  className="flex-1 min-w-0 text-base text-gray-800 placeholder-gray-500 bg-transparent border-none outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-[#eb61a2] rounded-lg hover:bg-[#d0578f] transition-colors"
                  title="Search"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchOpen(false);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </form>
              {/* Results dropdown */}
              <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-xl border-2 border-gray-200 shadow-xl max-h-[min(70vh,400px)] overflow-y-auto z-30">
                {searchProductsLoading ? (
                  <div className="py-8 text-center text-gray-500">
                    <i className="fa-solid fa-spinner fa-spin text-2xl"></i>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-6 text-center text-gray-500 text-sm">
                    {searchQuery.trim()
                      ? "No products match your search."
                      : "Type to search by product name or brand."}
                  </div>
                ) : (
                  <ul className="py-2">
                    {searchResults.map((p) => (
                      <li key={p?.id}>
                        <button
                          type="button"
                          onClick={() => goToProduct(p.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-pink-50 transition-colors"
                        >
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={getProductImageUrl(p)}
                              alt={p?.name || ""}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-900 block truncate">
                              {p?.name || "Unnamed"}
                            </span>
                            {(typeof p?.brand === "string"
                              ? p.brand
                              : p?.brand?.name) && (
                                <span className="text-xs text-gray-500 block truncate">
                                  {typeof p.brand === "string"
                                    ? p.brand
                                    : p.brand?.name}
                                </span>
                              )}
                          </div>
                          <i className="fa-solid fa-chevron-right text-gray-400 text-xs flex-shrink-0"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* RIGHT: Search icon (when closed), Favorite, Bag, Profile */}
          {!isSmallMobile && !isTinyMobile && (
            <div
              className={`flex items-center gap-3 min-w-0 flex-1 justify-end ${menuOpen && isMobile
                ? "flex-col absolute right-4 bg-white top-14 py-4 rounded-lg z-10"
                : "hidden md:flex"
                }`}
            >
              {!searchOpen && (
                <button
                  type="button"
                  onClick={openSearch}
                  className="text-gray-600 hover:text-[#eb61a2] transition-none p-0"
                  title="Search products"
                >
                  <Image src="/assets/NavbarIcons/Icons Search.svg" alt="Search" width={32} height={32} />
                </button>
              )}
              <Link
                href="/favorites"
                onClick={handleFavoriteClick}
                className="text-gray-600 hover:text-[#eb61a2] transition-none p-0"
                title="Favorites"
              >
                <Image src="/assets/NavbarIcons/Icons Favorite.svg" alt="Favorites" width={38} height={38} />
              </Link>
              <Link
                href="/bag_page"
                onClick={handleBagClick}
                className="text-gray-600 hover:text-[#eb61a2] transition-none p-0"
                title="Bag"
              >
                <Image src="/assets/NavbarIcons/Icons Bage.svg" alt="Bag" width={36} height={36} />
              </Link>
              {user ? (
                <Link
                  href="/profile"
                  onClick={() => safeNavigate("/profile")}
                  className="text-gray-600 hover:text-[#eb61a2] transition-colors pt-1.5 pr-1.5 pb-1.5 pl-[.7px]"
                  title="Profile"
                >
                  <Image src="/assets/NavbarIcons/Icons Profile.svg" alt="Profile" width={35} height={35} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => safeNavigate("/login")}
                    className="px-5 py-2 text-[#ed3b8e] text-sm font-semibold border-2 border-[#ed3b8e] rounded-lg hover:bg-[#ed3b8e] hover:text-white transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => safeNavigate("/signup")}
                    className="px-5 py-2 text-sm font-semibold border-2 border-[#eb61a2] bg-[#eb61a2] text-white rounded-lg hover:bg-[#d0578f] hover:border-[#d0578f]"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* 🚀 SMALL MOBILE BOTTOM NAVBAR (< 510px): Home, Products, Favorite, Cart, Profile */}
      {isSmallMobile && (
        <div className="fixed bottom-0 left-0 right-0 w-full bg-white h-20 shadow-xl z-[99999] flex justify-between items-center text-gray-600 px-2 sm:px-4">
          <button
            type="button"
            className="flex-1 flex items-center justify-center py-2 min-w-0 text-inherit bg-transparent border-none cursor-pointer hover:text-[#eb61a2] transition-none"
            onClick={() => safeNavigate("/")}
            title="Home"
          >
            <Image src="/assets/NavbarIcons/Icons Home.svg" alt="Home" width={38} height={38} />
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center py-2 min-w-0 text-inherit bg-transparent border-none cursor-pointer hover:text-[#eb61a2] transition-none"
            onClick={() => safeNavigate("/products")}
            title="Products"
          >
            <Image src="/assets/NavbarIcons/Icons Products.svg" alt="Products" width={38} height={38} />
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center py-2 min-w-0 text-inherit bg-transparent border-none cursor-pointer hover:text-[#eb61a2] transition-none"
            onClick={handleFavoriteClick}
            title="Favorites"
          >
            <Image src="/assets/NavbarIcons/Icons Favorite.svg" alt="Favorites" width={38} height={38} />
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center py-2 min-w-0 text-inherit bg-transparent border-none cursor-pointer hover:text-[#eb61a2] transition-none"
            onClick={handleBagClick}
            title="Cart"
          >
            <Image src="/assets/NavbarIcons/Icons Bage.svg" alt="Bag" width={36} height={36} />
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center py-2 min-w-0 text-inherit bg-transparent border-none cursor-pointer hover:text-[#eb61a2] transition-none"
            onClick={() => safeNavigate(user ? "/profile" : "/login")}
            title="Profile"
          >
            <Image src="/assets/NavbarIcons/Icons Profile.svg" alt="Profile" width={35} height={35} />
          </button>
        </div>
      )}

      {/* 🚀 TINY MOBILE BOTTOM NAVBAR (< 770px): Home, Products, Favorite, Cart, Profile */}
      {isTinyMobile && !isSmallMobile && (
        <div className="fixed bottom-0 left-0 right-0 w-full bg-white h-20 shadow-xl z-[99999] flex justify-between items-center text-gray-600 px-2 sm:px-4">
          <button
            type="button"
            className="flex-1 flex items-center justify-center py-2 min-w-0 text-inherit bg-transparent border-none cursor-pointer hover:text-[#eb61a2] transition-none"
            onClick={() => safeNavigate("/")}
            title="Home"
          >
            <Image src="/assets/NavbarIcons/Icons Home.svg" alt="Home" width={38} height={38} />
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center py-2 min-w-0 text-inherit bg-transparent border-none cursor-pointer hover:text-[#eb61a2] transition-none"
            onClick={() => safeNavigate("/products")}
            title="Products"
          >
            <Image src="/assets/NavbarIcons/Icons Products.svg" alt="Products" width={38} height={38} />
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center py-2 min-w-0 text-inherit bg-transparent border-none cursor-pointer hover:text-[#eb61a2] transition-none"
            onClick={handleFavoriteClick}
            title="Favorites"
          >
            <Image src="/assets/NavbarIcons/Icons Favorite.svg" alt="Favorites" width={38} height={38} />
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center py-2 min-w-0 text-inherit bg-transparent border-none cursor-pointer hover:text-[#eb61a2] transition-none"
            onClick={handleBagClick}
            title="Cart"
          >
            <Image src="/assets/NavbarIcons/Icons Bage.svg" alt="Bag" width={36} height={36} />
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center py-2 min-w-0 text-inherit bg-transparent border-none cursor-pointer hover:text-[#eb61a2] transition-none"
            onClick={() => safeNavigate(user ? "/profile" : "/login")}
            title="Profile"
          >
            <Image src="/assets/NavbarIcons/Icons Profile.svg" alt="Profile" width={35} height={35} />
          </button>
        </div>
      )}

      {loading && <Loading />}
      <MessageWidget />
    </>
  );
};

export default Navbar;