// src/app/products/page.tsx   ← must be this exact path

"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import axiosAuth from "../../../app/lib/api/axiosConfig";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";

import { FaCartPlus, FaHeart } from "react-icons/fa";
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
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("all");
  const [searchTerm, setSearchTerm] = useState(searchFromUrl);

  const urlFilters = useMemo(() => {
    const brands = searchParams.get("brand")?.split(",") || [];
    const rating = searchParams.get("rating")?.split(",") || [];
    const ageRange = searchParams.get("ageRange")?.split(",") || [];
    const skinType = searchParams.get("skinType")?.split(",") || [];
    return { brands, rating, ageRange, skinType };
  }, [searchParams]);

  useEffect(() => {
    setSearchTerm(searchFromUrl);
  }, [searchFromUrl]);

  const { user } = useAuthContext();
  const { addToCart, addToFavorite, loginFirst } = useUserActions();

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
        setProducts(res?.data?.data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [user]);

  const handleAddToCart = async (productId) => {
    await addToCart(productId, 1);
  };

  const handleFavorite = async (productId) => {
    await addToFavorite(productId);
  };

  const getGroupedAndFilteredProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const getBrand = (p) =>
        typeof p?.brand === "string" ? p.brand : p?.brand?.name;
      filtered = filtered.filter(
        (p) =>
          p?.name?.toLowerCase().includes(term) ||
          getBrand(p)?.toLowerCase().includes(term)
      );
    }

    const getPriceRating = (() => {
      const prices = products.map((p) => p?.price || 0).sort((a, b) => a - b);
      if (prices.length === 0) return () => 3;
      const p40 = prices[Math.floor(prices.length * 0.4)];
      const p80 = prices[Math.floor(prices.length * 0.8)];
      return (price) => {
        if (price >= p80) return 5;
        if (price >= p40) return 4;
        return 3;
      };
    })();

    const ageRangeCycle = [
      "10 - 20 years",
      "20 - 30 years", "20 - 30 years", "20 - 30 years", "20 - 30 years",
      "30 - 40 years", "30 - 40 years", "30 - 40 years",
      "40 - 50 years", "40 - 50 years",
    ];

    const skinTypeCycle = ["Oily", "Dry", "Combination", "Sensitive", "Acne-prone"];

    const { brands, rating, ageRange, skinType } = urlFilters;

    if (brands.length > 0 || rating.length > 0 || ageRange.length > 0 || skinType.length > 0) {
      filtered = filtered.filter((p, idx) => {
        const productAgeRange = ageRangeCycle[idx % ageRangeCycle.length];
        const productSkinType = skinTypeCycle[idx % skinTypeCycle.length];
        const productRating = getPriceRating(p?.price || 0);
        const brandName = (getBrand(p) || "").trim().toLowerCase();

        const matchesBrand = brands.some((b) => b.trim().toLowerCase() === brandName);
        const matchesRating = rating.includes(String(productRating));
        const matchesAge = ageRange.includes(productAgeRange);
        const matchesSkin = skinType.includes(productSkinType);

        const activeMatches = [];
        if (brands.length > 0) activeMatches.push(matchesBrand);
        if (rating.length > 0) activeMatches.push(matchesRating);
        if (ageRange.length > 0) activeMatches.push(matchesAge);
        if (skinType.length > 0) activeMatches.push(matchesSkin);

        return activeMatches.some(m => m);
      });
    }

    if (sortBy === "price-high") {
      filtered.sort((a, b) => (b?.price || 0) - (a?.price || 0));
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => (a?.price || 0) - (b?.price || 0));
    } else if (sortBy === "new") {
      filtered.sort((a, b) => (b?.id || 0) - (a?.id || 0));
    } else if (sortBy === "recommended") {
      filtered.sort((a, b) => (b?.name?.length || 0) - (a?.name?.length || 0));
    }

    if (
      sortBy === "price-high" ||
      sortBy === "price-low" ||
      sortBy === "recommended" ||
      sortBy === "new"
    ) {
      const categoryLabels = {
        "price-high": "Price High to Low",
        "price-low": "Price Low to High",
        recommended: "Recommended",
        new: "What's New",
      };
      return { [categoryLabels[sortBy]]: filtered };
    }

    return filtered.reduce((acc, product) => {
      const categoryName = product.category?.name || "Uncategorized";
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(product);
      return acc;
    }, {});
  };

  const groupedProducts = getGroupedAndFilteredProducts();

  const sortedCategories = Object.entries(groupedProducts).sort(
    (a, b) => b[1].length - a[1].length
  );

  const hasProducts = sortedCategories.length > 0;

  return (
    <>
      <Navbar alwaysVisible={true} />
      <main className="pt-[8.5rem] px-0 pb-16 bg-[#CCF6F2] font-[Poppins,sans-serif]">
        {/* ===== Hero Section ===== */}
        <div className="w-full -mt-[4.5rem]">
          <h1 className="w-full h-[9rem] flex items-end justify-center text-4xl font-bold  bg-[#ffffff] text-[#EB61A2] pb-[13px]">
            Our Products
          </h1>
        </div>

        {/* ===== Main Content with Fixed Left Sidebar ===== */}
        <div className="flex ">
          {/* Fixed Left Sidebar */}
          <div className="w-[200px] bg-white border-r border-gray-200 rounded-[1rem] shadow-lg fixed left-0 top-[8.5rem] h-[calc(100vh-10.5rem)]">
            <div className="p-4 flex flex-col h-[calc(100vh-8.5rem)]">
              <div className="relative -mx-4 px-4 -mt-4 pt-4 pb-3 bg-white border-t rounded-[1rem] border-b border-gray-200">
                <h3 className="text-[#EB61A2] text-[1.5rem] font-bold text-center">
                  Sort By
                </h3>
              </div>
              <div className="flex flex-col flex-1 overflow-y-auto pt-2 mx-[-1rem]">
                {[
                  { value: "all", label: "All Products" },
                  { value: "recommended", label: "Recommended" },
                  { value: "new", label: "What's New" },
                  { value: "price-high", label: "Price High to Low" },
                  { value: "price-low", label: "Price Low to High" },
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className="px-4 text-[1rem] py-3 cursor-pointer border-b border-black/20 flex justify-between items-center hover:bg-white/50 transition"
                  >
                    <span>{option.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full border border-black flex items-center justify-center ${
                        sortBy === option.value ? "bg-white" : ""
                      }`}
                    >
                      {sortBy === option.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-black" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Products Area */}
          <div className="flex-1 pl-6 pr-4 ml-[200px]">
            {loading ? (
              <Loading />
            ) : !hasProducts ? (
              <p className="text-center text-gray-500 text-lg mt-20">
                No products found.
              </p>
            ) : (
              <div className="space-y-16 pt-6">
                {sortedCategories.map(([categoryName, productsInCategory]) => (
                  <section key={categoryName}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b-[3px] border-[#000000] opacity-[.7] inline-block">
                      {categoryName}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 z-[1]">
                      {productsInCategory.map((p) => {
                        const brand =
                          typeof p?.brand === "string"
                            ? p.brand
                            : p?.brand?.name ?? "";
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
                                onClick={() =>
                                  router.push(
                                    `/product_details?productId=${p.id}`
                                  )
                                }
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
                              <h3
                                className="text-[1.15rem] font-bold text-gray-800 truncate"
                                title={p?.name}
                              >
                                {p?.name || "No Name"}
                              </h3>
                              <p
                                className="text-xs text-gray-500 truncate opacity-80"
                                title={desc}
                              >
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
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Products;