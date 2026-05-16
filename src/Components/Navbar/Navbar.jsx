"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const pathname = usePathname();

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
  const [brands, setBrands] = useState([]);
  const [hoveredFilter, setHoveredFilter] = useState(null);

  const navRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);
  const filterRefs = useRef({});

  // Initialize screen size
  useEffect(() => {
    setIsClient(true);
    setIsMobile(window.innerWidth <= 1030);
    setIsSmallMobile(window.innerWidth <= 510);
    setIsTinyMobile(window.innerWidth <= 770);
  }, []);

  // Fetch brands when user is available
  useEffect(() => {
    if (!user) return;
    const fetchBrands = async () => {
      try {
        const res = await axiosAuth.get("/products/all");
        const fetchedProducts = res?.data?.data || [];
        const brandSet = new Set();
        fetchedProducts.forEach(p => {
          const brandName = typeof p?.brand === "string" ? p.brand : p?.brand?.name;
          if (brandName) brandSet.add(brandName);
        });
        setBrands([...brandSet]);
      } catch (err) {
        console.error("Error fetching brands:", err);
      }
    };
    fetchBrands();
  }, [user]);

  // Read URL params for filters
  const urlFilters = useMemo(() => {
    const params = {};
    params.brand = searchParams.get("brand")?.split(",") || [];
    params.rating = searchParams.get("rating")?.split(",") || [];
    params.ageRange = searchParams.get("ageRange")?.split(",") || [];
    params.skinType = searchParams.get("skinType")?.split(",") || [];
    return params;
  }, [searchParams]);

  // Handle filter selection with URL update
  const handleFilterSelect = useCallback((filterType, value) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get(filterType)?.split(",") || [];
    const newValues = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    newValues.length ? params.set(filterType, newValues.join(",")) : params.delete(filterType);
    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  }, [router, searchParams]);

  // Compute selected filters for display
  const selectedFilters = useMemo(() => {
    const filters = [];
    if (urlFilters.brand.length > 0) {
      urlFilters.brand.forEach(b => {
        filters.push({
          label: `Brand: ${b}`,
          remove: () => handleFilterSelect('brand', b)
        });
      });
    }
    if (urlFilters.rating.length > 0) {
      urlFilters.rating.forEach(r => {
        filters.push({
          label: `Rating: ${r} Stars`,
          remove: () => handleFilterSelect('rating', r)
        });
      });
    }
    if (urlFilters.ageRange.length > 0) {
      urlFilters.ageRange.forEach(a => {
        filters.push({
          label: `Age Range: ${a}`,
          remove: () => handleFilterSelect('ageRange', a)
        });
      });
    }
    if (urlFilters.skinType.length > 0) {
      urlFilters.skinType.forEach(s => {
        filters.push({
          label: `Skin Type: ${s}`,
          remove: () => handleFilterSelect('skinType', s)
        });
      });
    }
    return filters;
  }, [urlFilters, handleFilterSelect]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('brand');
    params.delete('rating');
    params.delete('ageRange');
    params.delete('skinType');
    const query = params.toString();
    router.push(query ? `/products?${query}` : '/products');
  }, [router, searchParams]);

  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth <= 1030);
    setIsSmallMobile(window.innerWidth <= 510);
    setIsTinyMobile(window.innerWidth <= 770);
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
      {/* NAVBAR WRAPPER - contains both navbar and filter row */}
      <div
        className="fixed left-0 top-0 w-full z-[9999] transition-transform duration-50 ease-out"
        style={{ transform: `translateY(${translateY}px)` }}
      >
      {/* NORMAL NAVBAR */}
      <nav
        className="w-full bg-white shadow-xl h-20"
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

{/* Filter Row - appears below navbar on products page */}
        {pathname === '/products' && (
         <div 
           className="w-full bg-white border-t border-b border-gray-200 shadow-sm"
           onMouseLeave={() => setHoveredFilter(null)}
         >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-16 max-[1000px]:gap-10 max-[770px]:gap-6 max-[700px]:gap-4 h-14 px-4">
             {["Brand", "Rating", "Age Range", "Skin Type"].map((filter) => (
               <div
                 key={filter}
                 className="relative"
                 onMouseEnter={() => setHoveredFilter(filter)}
                 ref={(el) => (filterRefs.current[filter] = el)}
               >
                  <button
                    className="flex items-center gap-1 text-gray-700 hover:text-[#eb61a2] font-medium transition-colors max-[510px]:text-sm"
                    type="button"
                  >
                   <span>{filter}</span>
                   <i className="fa-solid fa-chevron-down text-xs"></i>
                 </button>
                 
{/* Dropdown */}
    {hoveredFilter === filter && (
      <div className={`absolute top-full ${hoveredFilter === 'Skin Type' || hoveredFilter === 'Selected' ? 'left-0 max-[750px]:-left-32' : 'left-0'} w-64 ${hoveredFilter === 'Skin Type' || hoveredFilter === 'Selected' ? 'max-[750px]:w-56' : ''} bg-white border border-gray-200 rounded-lg shadow-xl z-[10000] py-2`}>
                      {filter === "Brand" && (
                        brands.length > 0 ? (
                          brands.map((brand) => (
                            <button
                              key={brand}
                              onClick={() => handleFilterSelect("brand", brand)}
                              className={`w-full text-left px-5 py-3 text-base hover:bg-gray-100 transition-colors flex items-center justify-between ${
                                urlFilters.brand.includes(brand) ? "text-[#eb61a1] font-medium" : "text-gray-700"
                              }`}
                            >
                              <span>{brand}</span>
                              {urlFilters.brand.includes(brand) && <i className="fa-solid fa-check text-[#eb61a1]"></i>}
                            </button>
                          ))
                        ) : (
                         <div className="px-5 py-3 text-base text-gray-500">No brands available</div>
                       )
                     )}
{filter === "Rating" && [5, 4, 3].map((stars) => (
                        <button
                          key={stars}
                          onClick={() => handleFilterSelect("rating", String(stars))}
                          className={`w-full text-left px-5 py-3 text-base hover:bg-gray-100 transition-colors flex items-center justify-between ${
                            urlFilters.rating.includes(String(stars)) ? "text-[#eb61a1] font-medium" : "text-gray-700"
                          }`}
                        >
                           <div className="flex items-center gap-2">
                             <span className="flex">
                               {[1,2,3,4,5].map(i => {
                                 const isSelected = urlFilters.rating.includes(String(stars));
                                 const color = isSelected ? "#eb61a1" : "#000";
                                 return i <= stars 
                                   ? <FaStar key={i} className="text-base" style={{color}} /> 
                                   : <FaRegStar key={i} className="text-base" style={{color}} />;
                               })}
                             </span>
                             <span>{stars} Stars</span>
                           </div>
                          {urlFilters.rating.includes(String(stars)) && <i className="fa-solid fa-check text-[#eb61a1]"></i>}
                        </button>
                      ))}
{filter === "Age Range" && ["10 - 20 years", "20 - 30 years", "30 - 40 years", "40 - 50 years"].map((ageRange) => (
                        <button
                          key={ageRange}
                          onClick={() => handleFilterSelect("ageRange", ageRange)}
                          className={`w-full text-left px-5 py-3 text-base hover:bg-gray-100 transition-colors flex items-center justify-between ${
                            urlFilters.ageRange.includes(ageRange) ? "text-[#eb61a1] font-medium" : "text-gray-700"
                          }`}
                        >
                          <span>{ageRange}</span>
                          {urlFilters.ageRange.includes(ageRange) && <i className="fa-solid fa-check text-[#eb61a1]"></i>}
                        </button>
                      ))}
{filter === "Skin Type" && ["Oily", "Dry", "Combination", "Sensitive", "Acne-prone"].map((skinType) => (
                        <button
                          key={skinType}
                          onClick={() => handleFilterSelect("skinType", skinType)}
                          className={`w-full text-left px-5 py-3 text-base hover:bg-gray-100 transition-colors flex items-center justify-between ${
                            urlFilters.skinType.includes(skinType) ? "text-[#eb61a1] font-medium" : "text-gray-700"
                          }`}
                        >
                          <span>{skinType}</span>
                          {urlFilters.skinType.includes(skinType) && <i className="fa-solid fa-check text-[#eb61a1]"></i>}
                        </button>
                      ))}
                   </div>
                 )}
               </div>
              ))}
              {/* Selected Filters - only show if there are selected filters */}
              {selectedFilters.length > 0 && (
                <div className="relative">
                <div
                  onMouseEnter={() => setHoveredFilter('Selected')}
                  ref={(el) => (filterRefs.current['Selected'] = el)}
                >
                  <button
                    className="flex items-center gap-1 text-gray-700 hover:text-[#eb61a2] font-medium transition-colors max-[510px]:text-sm"
                    type="button"
                  >
                    <span className="text-[#eb61a2]">Selected</span>
                    <i className="fa-solid fa-chevron-down text-xs"></i>
                  </button>
                </div>

                {hoveredFilter === 'Selected' && (
                  <div className="absolute top-full left-0 max-[750px]:-left-32 w-64 max-[750px]:w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-[10000] py-2">
                    <button
                      onClick={clearAllFilters}
                      className="w-full text-left font-bold px-5 py-3 text-base text-red-500 hover:bg-gray-100 transition-colors"
                    >
                      Clear All
                    </button>
                    {selectedFilters.length === 0 ? (
                      <div className="px-5 py-3 text-base text-gray-500">No filters selected</div>
                    ) : (
                      selectedFilters.map((filter, idx) => (
                        <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-gray-100 transition-colors">
                          <span className="text-gray-700">{filter.label}</span>
                          <button
                            onClick={filter.remove}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Remove this filter"
                          >
                            <i className="fa-solid fa-xmark text-[1.5rem]"></i>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        )}
      </div>

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
