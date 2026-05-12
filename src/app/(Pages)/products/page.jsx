// src/app/products/page.tsx   ← must be this exact path

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import axiosAuth from "../../../app/lib/api/axiosConfig";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";

import { FaCartPlus, FaHeart, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import useAuthContext from "../../../app/lib/Authentication/AuthContext";
import Loading from "../../../Components/Loading/Loading";
import useUserActions from "../../../Components/Hooks/userUserActions";
import { getProductImageUrl } from "../../../app/lib/productImage";
import { formatPrice } from "../../../app/lib/formatPrice";

const ThirdImage = "/assets/third_image.png";

const getBrand = (product) => {
  if (typeof product?.brand === "string") return product.brand;
  return product?.brand?.name ?? "";
};

const Products = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [loading, setLoading] = useState(true);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("all");
  const [subFilterView, setSubFilterView] = useState(null);
  const [selectedSubFilters, setSelectedSubFilters] = useState({});

  // Disable page scroll when sidebar is open
  useEffect(() => {
    if (isSortOpen || isFilterOpen) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = 'auto';
    }
    return () => {
      document.documentElement.style.overflow = 'auto';
    };
  }, [isSortOpen, isFilterOpen]);


  // Sync search term from URL (e.g. when navigating from Navbar search)
  useEffect(() => {
    setSearchTerm(searchFromUrl);
  }, [searchFromUrl]);

  const { user } = useAuthContext();
  const { addToCart, addToFavorite, loginFirst } = useUserActions();

  /* ------------------- FETCH CATEGORIES ------------------- */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosAuth.get("/categories/all-categories");
        setCategories(res?.data?.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  /* ------------------- FETCH PRODUCTS ------------------- */
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axiosAuth.get("/products/all");
        const fetchedProducts = res?.data?.data || [];
        setProducts(fetchedProducts);
        // Extract unique brands using getBrand helper
        const brandSet = new Set();
        fetchedProducts.forEach(p => {
          const brandName = getBrand(p);
          if (brandName) brandSet.add(brandName);
        });
        setBrands([...brandSet]);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [user]);

  /* ------------------- HANDLERS ------------------- */
  const handleAddToCart = async (productId) => {
    await addToCart(productId, 1);
  };

  const handleFavorite = async (productId) => {
    await addToFavorite(productId);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };




  /* ------------------- FILTER & GROUP PRODUCTS ------------------- */
  const getGroupedAndFilteredProducts = () => {
    let filtered = [...products];

    // Filter by search term (name or brand)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const getBrand = (p) =>
        typeof p?.brand === "string"
          ? p.brand
          : p?.brand?.name;
      filtered = filtered.filter(
        (p) =>
          p?.name?.toLowerCase().includes(term) ||
          getBrand(p)?.toLowerCase().includes(term)
      );
    }

    // Filter by selected category from dropdown
    if (selectedCategory) {
      const categoryId = Number(selectedCategory);
      filtered = filtered.filter((p) => p.category?.id === categoryId);
    }

    // Derive rating from price: top 20% = 5★, middle 40% = 4★, bottom 40% = 3★
    const getPriceRating = (() => {
      const prices = products.map(p => p?.price || 0).sort((a, b) => a - b);
      if (prices.length === 0) return () => 3;
      const p40 = prices[Math.floor(prices.length * 0.40)];
      const p80 = prices[Math.floor(prices.length * 0.80)];
      return (price) => {
        if (price >= p80) return 5;
        if (price >= p40) return 4;
        return 3;
      };
    })();

    // Derive age range: balanced with more 30-40 and 40-50
    // Distribution per 10 products: 10-20: 1, 20-30: 4, 30-40: 3, 40-50: 2
    const knownAgeRanges = ["10 - 20 years", "20 - 30 years", "30 - 40 years", "40 - 50 years"];
    const ageRangeCycle = [
      "10 - 20 years",  // 1
      "20 - 30 years", "20 - 30 years", "20 - 30 years", "20 - 30 years",  // 4
      "30 - 40 years", "30 - 40 years", "30 - 40 years",  // 3
      "40 - 50 years", "40 - 50 years"   // 2
    ];

    // Derive skin type: all types appear evenly (20% each)
    const knownSkinTypes = ["Oily", "Dry", "Combination", "Sensitive", "Acne-prone"];
    const skinTypeCycle = ["Oily", "Dry", "Combination", "Sensitive", "Acne-prone"];

    // Create map of product id to index for derived values
    products.forEach((p, idx) => {
      p._ageRange = ageRangeCycle[idx % ageRangeCycle.length];
      p._skinType = skinTypeCycle[idx % skinTypeCycle.length];
    });

    // Filter by selected sub-filters
    // Between categories = AND, within each category = OR
    const activeSubFilters = Object.entries(selectedSubFilters).filter(([_, v]) => v).map(([k]) => k);
    if (activeSubFilters.length > 0) {
      const selectedBrands = activeSubFilters.filter(f => !knownSkinTypes.includes(f) && !knownAgeRanges.includes(f) && !f.endsWith(" Stars"));
      const selectedSkinTypes = activeSubFilters.filter(f => knownSkinTypes.includes(f));
      const selectedAgeRanges = activeSubFilters.filter(f => knownAgeRanges.includes(f));
      const selectedRatings = activeSubFilters.filter(f => f.endsWith(" Stars")).map(f => parseInt(f));

      filtered = filtered.filter((p) => {
        const brandName = (getBrand(p) || "").trim().toLowerCase();
        const ageRange = p._ageRange;
        const rating = getPriceRating(p?.price || 0);
        // Always use derived skin type for consistent filtering
        const effectiveSkinTypes = [p._skinType];

        if (selectedBrands.length > 0 && !selectedBrands.some(b => b.trim().toLowerCase() === brandName)) return false;
        if (selectedSkinTypes.length > 0 && !selectedSkinTypes.some(st => effectiveSkinTypes.includes(st))) return false;
        if (selectedAgeRanges.length > 0 && !selectedAgeRanges.includes(ageRange)) return false;
        if (selectedRatings.length > 0 && !selectedRatings.some(r => rating >= r)) return false;

        return true;
      });
    }

    // Apply sort order
    if (sortBy === "price-high") {
      filtered.sort((a, b) => (b?.price || 0) - (a?.price || 0));
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => (a?.price || 0) - (b?.price || 0));
    } else if (sortBy === "new") {
      // Sort by highest ID (assuming newer products have higher IDs)
      filtered.sort((a, b) => (b?.id || 0) - (a?.id || 0));
    } else if (sortBy === "recommended") {
      // Sort by longest name to shortest
      filtered.sort((a, b) => (b?.name?.length || 0) - (a?.name?.length || 0));
    }

    // For price, new, and recommended, don't group by category
    if (sortBy === "price-high" || sortBy === "price-low" || sortBy === "recommended" || sortBy === "new") {
      const categoryLabels = {
        "price-high": "Price High to Low",
        "price-low": "Price Low to High",
        "recommended": "Recommended",
        "new": "What's New"
      };
      return { [categoryLabels[sortBy]]: filtered };
    }

    // Group filtered products by category
    return filtered.reduce((acc, product) => {
      const categoryName = product.category?.name || "Uncategorized";
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(product);
      return acc;
    }, {});
  };

  const groupedProducts = getGroupedAndFilteredProducts();
  
  // Sort categories by the number of products in descending order
  const sortedCategories = Object.entries(groupedProducts).sort(
    (a, b) => b[1].length - a[1].length
  );

  const hasProducts = sortedCategories.length > 0;

  return (
    <>
      <Navbar alwaysVisible={true} />
      <main className="pt-0 px-0 pb-16 bg-[#CCF6F2] font-[Poppins,sans-serif]">
        {/* ===== Filter Section ===== */}
        <div className="w-full mb-12">
          <h1 className="w-full h-[9rem] flex items-end justify-center text-4xl font-bold text-white bg-[#FF85BB] pb-[13px]">Our Products</h1>
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-start gap-4 mt-6 pl-4">
            <div className="relative">
              <img src="/assets/ProductsSortByAndFilterIcons/for sort by.svg" alt="Sort" className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10 w-7 h-7" />
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="font-semibold w-30 h-12 pl-5 pr-10 rounded-xl border-2 border-[#eb61a1] bg-transparent text-[1.7rem] text-[#eb61a1] cursor-pointer focus:outline-none focus:border-[#eb61a1] focus:ring-4 focus:ring-pink-100 transition"
              >
                Sort By
              </button>
              {/* Backdrop */}
              {isSortOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-[10001]"
                  onClick={() => setIsSortOpen(false)}
                />
              )}
          {/* Sort By part */}
<div className={`fixed top-0 left-0 w-[30vw] h-screen bg-white/30 backdrop-blur-2xl border-r shadow-lg z-[10002] transition-transform duration-500 ease-out ${isSortOpen ? 'translate-x-0' : 'translate-x-[-100%]'}`}>
                <div className="p-4 relative h-full flex flex-col">
                  <div className="relative -mx-4 px-4 -mt-4 pt-4 pb-2 bg-[#EB61A2]">
                      <button
                        onClick={() => setIsSortOpen(false)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-[3.5rem] h-[3.5rem] text-white hover:text-gray-700 flex items-center justify-center"
                      >
                        <div className="relative w-[72px] h-[72px]" style={{filter: 'invert(1)'}}>
                          <Image
                            src="/assets/CloseButtonForFilterAndSortBy/close button.svg"
                            alt="Close"
                            fill
                            unoptimized
                          />
                        </div>
                      </button>
                      <h3 className="text-white text-[2.5rem] font-bold text-center flex-1">
                        Sort By
                      </h3>
                    </div>
                    <div className="flex flex-col flex-1 overflow-y-auto pt-2 mx-[-1rem]">
{[
                        { value: "all", label: "All Products" },
                        { value: "recommended", label: "Recommended" },
                        { value: "new", label: "What's New" },
                        { value: "price-high", label: "Price High to Low" },
                        { value: "price-low", label: "Price Low to High" }
                      ].map((option) => (
                        <div
                          key={option.value}
                          onClick={() => setSortBy(option.value)}
                          className="px-4 text-[1.3rem] py-3 cursor-pointer border-b border-black flex justify-between items-center"
                        >
                          <span>{option.label}</span>
                          <div className={`w-5 h-5 rounded-full border border-black flex items-center justify-center ${sortBy === option.value ? "bg-white" : ""}`}>
                            {sortBy === option.value && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="p-4">
                    <button
                      onClick={() => setIsSortOpen(false)}
                      className="w-full border-2 border-[#FFFFFF] text-[#FFFFFF] text-[1.3rem] font-bold py-3 rounded-xl hover:bg-[#EB61A2] hover:text-white transition"
                    >
                      VIEW ITEMS
                    </button>
                  </div>
                </div>
              </div>
            </div>


            {/* Filter part */}
            <div className="relative flex items-center">
              <div className="relative">
                <img src="/assets/ProductsSortByAndFilterIcons/for filter.svg" alt="Filter" className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10 w-7 h-7" />
                <button
                   onClick={() => {
                     setIsFilterOpen(true);
                     setSubFilterView(null);
                   }}
                   className="font-semibold flex items-center w-30 h-12 pl-5 pr-10 rounded-xl border-2 border-[#eb61a1] bg-transparent text-[1.7rem] text-[#eb61a1] cursor-pointer focus:outline-none focus:border-[#eb61a1] focus:ring-4 focus:ring-pink-100 transition"
                 >
                   Filter
                 </button>
              </div>
{/* Selected Filter Tags with Clear All */}
{Object.values(selectedSubFilters).some(Boolean) && (
  <div className="flex flex-wrap items-center gap-2 ml-2 mt-1 z-10 max-w-[60vw]">
    <button
      onClick={() => setSelectedSubFilters({})}
      className="text-[0.9rem] text-[#eb61a1] hover:text-[#d64d91] underline cursor-pointer whitespace-nowrap"
    >
      Clear All
    </button>
    {Object.entries(selectedSubFilters)
      .filter(([_, selected]) => selected)
      .map(([filter]) => (
        <button
          key={filter}
          onClick={() =>
            setSelectedSubFilters(prev => ({ ...prev, [filter]: false }))
          }
          className="inline-flex items-center bg-[#eb61a1] text-white text-[1rem] px-3 py-1 rounded-full hover:bg-[#d64d91] transition whitespace-nowrap"
          title={`Remove ${filter}`}
        >
          {filter}
          <svg
            className="ml-2 w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      ))}
  </div>
)}
{/* Backdrop */}
               {isFilterOpen && (
                 <div
                   className="fixed inset-0 bg-black/50 z-[10001]"
                   onClick={() => {
                     setIsFilterOpen(false);
                     setSubFilterView(null);
                   }}
                 />
               )}
              <div className={`fixed top-0 left-0 w-[30vw] h-screen bg-white/30 backdrop-blur-2xl border-r shadow-lg z-[10002] transition-transform duration-500 ease-out ${isFilterOpen ? 'translate-x-0' : 'translate-x-[-100%]'}`}>
                <div className="p-4 relative h-full flex flex-col">
                  <div className="relative -mx-4 px-4 -mt-4 pt-4 pb-2 bg-[#EB61A2]">
                    {subFilterView && (
                      <button
                        onClick={() => setSubFilterView(null)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5rem] h-[3.5rem] text-white hover:text-gray-700 flex items-center justify-center"
                      >
                        <div className="relative w-[72px] h-[72px]" style={{filter: 'invert(1)'}}>
                          <Image
                            src="/assets/CloseButtonForFilterAndSortBy/Icons Back.svg"
                            alt="Back"
                            fill
                            unoptimized
                          />
                        </div>
                      </button>
                    )}
<button
                       onClick={() => {
                         setIsFilterOpen(false);
                         setSubFilterView(null);
                       }}
                       className="absolute right-0 top-1/2 -translate-y-1/2 w-[3.5rem] h-[3.5rem] text-white hover:text-gray-700 flex items-center justify-center"
                     >
                      <div className="relative w-[72px] h-[72px]" style={{filter: 'invert(1)'}}>
                        <Image
                          src="/assets/CloseButtonForFilterAndSortBy/close button.svg"
                          alt="Close"
                          fill
                          unoptimized
                        />
                      </div>
                    </button>
                    <h3 className="text-white text-[2.5rem] font-bold text-center flex-1">
                      Filter
                    </h3>
                    </div>
<div className="flex flex-col flex-1 overflow-y-auto pt-2 mx-[-1rem]">
                       <div className="relative w-full h-full overflow-hidden">
                         {/* Main Filter View - shows Brand, Rating, Age Range, Skin Type */}
                         <div 
                           className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                             subFilterView ? "-translate-x-full" : "translate-x-0"
                           }`}
                         >
                           {["Brand", "Rating", "Age Range", "Skin Type"].map((filter) => (
                             <div
                               key={filter}
                               onClick={() => {
                                 if (filter === "Skin Type") {
                                   setSubFilterView("skin-type");
                                 } else if (filter === "Brand") {
                                   setSubFilterView("brand");
                                 } else if (filter === "Age Range") {
                                   setSubFilterView("age-range");
                                 } else if (filter === "Rating") {
                                   setSubFilterView("rating");
                                 }
                               }}
                               className="px-4 text-[1.3rem] py-3 cursor-pointer border-b border-black flex justify-between items-center"
                             >
                               <span>{filter}</span>
                             </div>
                           ))}
</div>
                        {/* Brand Sub-Filters View */}
                        <div 
                          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                            subFilterView === "brand" ? "translate-x-0" : "translate-x-full"
                          }`}
                        >
                          {loading ? (
                            <div className="px-4 text-[1.3rem] py-3 text-gray-500">
                              Loading brands...
                            </div>
                          ) : brands.length > 0 ? brands.map((brand) => (
                            <div
                              key={brand}
                              onClick={() => {
                                setSelectedSubFilters(prev => ({
                                  ...prev,
                                  [brand]: !prev[brand]
                                }));
                              }}
                              className="px-4 text-[1.3rem] py-3 cursor-pointer border-b border-black flex justify-between items-center"
                            >
                              <span>{brand}</span>
                              <div className="w-6 h-6 border-2 border-black flex items-center justify-center">
                                {selectedSubFilters[brand] && (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                            </div>
                          )) : (
                            <div className="px-4 text-[1.3rem] py-3 text-gray-500">
                              No brands available
                            </div>
                          )}
                        </div>
                        {/* Skin Type Sub-Filters View */}
                        <div 
                          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                            subFilterView === "skin-type" ? "translate-x-0" : "translate-x-full"
                          }`}
                        >
                          {["Oily", "Dry", "Combination", "Sensitive", "Acne-prone"].map((skinType) => (
                            <div
                              key={skinType}
                              onClick={() => {
                                setSelectedSubFilters(prev => ({
                                  ...prev,
                                  [skinType]: !prev[skinType]
                                }));
                              }}
                              className="px-4 text-[1.3rem] py-3 cursor-pointer border-b border-black flex justify-between items-center"
                            >
                              <span>{skinType}</span>
                              <div className="w-6 h-6 border-2 border-black flex items-center justify-center">
                                {selectedSubFilters[skinType] && (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Age Range Sub-Filters View */}
                        <div 
                          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                            subFilterView === "age-range" ? "translate-x-0" : "translate-x-full"
                          }`}
                        >
                          {["10 - 20 years", "20 - 30 years", "30 - 40 years", "40 - 50 years"].map((ageRange) => (
                            <div
                              key={ageRange}
                              onClick={() => {
                                setSelectedSubFilters(prev => ({
                                  ...prev,
                                  [ageRange]: !prev[ageRange]
                                }));
                              }}
                              className="px-4 text-[1.3rem] py-3 cursor-pointer border-b border-black flex justify-between items-center"
                            >
                              <span>{ageRange}</span>
                              <div className="w-6 h-6 border-2 border-black flex items-center justify-center">
                                {selectedSubFilters[ageRange] && (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Rating Sub-Filters View */}
                        <div 
                          className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                            subFilterView === "rating" ? "translate-x-0" : "translate-x-full"
                          }`}
                        >
                          {[5, 4, 3].map((stars) => (
                            <div
                              key={stars}
                              onClick={() => {
                                setSelectedSubFilters(prev => ({
                                  ...prev,
                                  [`${stars} Stars`]: !prev[`${stars} Stars`]
                                }));
                              }}
                              className="px-4 text-[1.3rem] py-3 cursor-pointer border-b border-black flex justify-between items-center"
                            >
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <span key={i} className={`text-2xl ${i <= stars ? "text-black" : "text-transparent [-webkit-text-stroke:1px_#000]"}`}>★</span>
                                ))}
                                <span className="ml-2">{stars} Stars</span>
                              </div>
                              <div className="w-6 h-6 border-2 border-black flex items-center justify-center">
                                {selectedSubFilters[`${stars} Stars`] && (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  <div className="p-4 flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedCategory("");
                        setSelectedSubFilters({});
                        setSortBy("all");
                      }}
                      className="flex-1 bg-[#EB61A2] text-white text-[1.3rem] font-bold py-3 rounded-xl hover:bg-[#d64d91] transition"
                    >
                      CLEAR ALL
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1 border-2 border-[#FFFFFF] text-[#FFFFFF] text-[1.3rem] font-bold py-3 rounded-xl hover:bg-[#EB61A2] hover:text-white transition"
                    >
                      VIEW ITEMS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Filter end */}

        {/* ===== Products by Category ===== */}
        {loading ? (
          <Loading />
        ) : !hasProducts ? (
          <p className="text-center text-gray-500 text-lg mt-20">No products found.</p>
        ) : (
          <div className="max-w-7xl mx-auto space-y-16">
            {sortedCategories.map(([categoryName, productsInCategory]) => (
              <section key={categoryName}>
                <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b-[3px] border-[#000000] opacity-[.7] inline-block">
                  {categoryName}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 z-[1]">
                  {productsInCategory.map((p) => {
                    const brand = typeof p?.brand === "string" ? p.brand : p?.brand?.name ?? "";
                    const desc = p?.description?.trim() || "No description";
                    return (
                      <div
                        key={p?.id}
                        className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-[100]"
                      >
                        <div className="relative h-[200px] bg-gray-100">
                          <Image
                            src={getProductImageUrl(p, ThirdImage)}
                            alt={p?.name || "Product"}
                            fill
                            className="object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                            sizes="(max-width: 600px) 50vw, 200px"
                            unoptimized
                            onClick={() => router.push(`/product_details?productId=${p.id}`)}
                          />
                          <button
                            type="button"
                            onClick={() => handleFavorite(p.id)}
                            className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-[#e53e3e] hover:bg-red-50 transition-colors"
                          >
                            <FaHeart className="text-sm" />
                          </button>
                        </div>
                        <div className="flex flex-col flex-1 p-4 gap-1 min-w-0 text-center">
                          {brand && (
                            <span className="opacity-70 text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                              {brand}
                            </span>
                          )}
                          <h3 className="text-[1.15rem] font-bold text-gray-800 truncate" title={p?.name}>
                            {p?.name || "No Name"}
                          </h3>
                          <p className="text-xs text-gray-500 truncate opacity-80" title={desc}>
                            {desc}
                          </p>
                          <p className="text-sm font-bold text-black mt-1">
                            {formatPrice(p?.price)}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(p.id)}
                            className="mt-3 w-full bg-[#d13e82] text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#c32c70] transition-colors"
                          >
                            <FaCartPlus className="text-base" /> Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Products;