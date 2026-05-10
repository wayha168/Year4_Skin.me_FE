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

const Products = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [loading, setLoading] = useState(true);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
    let filtered = products;

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
              <img src="/assets/ProductsSortByAndFilterIcons/for sort by.svg" alt="Sort" className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10 w-6 h-6" />
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-48 h-12 pl-5 pr-10 rounded-xl border-2 border-[#eb61a1] bg-transparent text-2xl text-[#eb61a1] cursor-pointer focus:outline-none focus:border-[#eb61a1] focus:ring-4 focus:ring-pink-100 transition"
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
              <div className={`fixed top-0 left-0 w-[30vw] h-screen bg-white border-r shadow-lg z-[10002] transition-transform duration-500 ease-out ${isSortOpen ? 'translate-x-0' : 'translate-x-[-100%]'}`}>
                <div className="p-4 relative h-full flex flex-col">
                  <div className="relative mb-4 -mx-4 px-4 -mt-4 pt-4 pb-2 bg-[#EB61A2]"> 
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
                  <div className="flex flex-col gap-2 flex-1 overflow-y-auto mx-[-1rem]">
                    <div
                      onClick={() => {
                        setSelectedCategory("");
                        setIsSortOpen(false);
                      }}
                      className="px-4  text-[1.3rem] py-3 hover:bg-gray-100 cursor-pointer border-b border-black"
                    >
                      All
                    </div>
                    {categories.map((cat) => (
                      <div
                        key={cat?.id}
                        onClick={() => {
                          setSelectedCategory(cat?.id);
                          setIsSortOpen(false);
                        }}
                        className="px-4 text-[1.3rem] py-3 hover:bg-gray-100 cursor-pointer  border-b border-black"
                      >
                        {cat?.name || "Unnamed Category"}
                      </div>
                    ))}
                  </div>
                  <div className="p-4">
                    <button
                      onClick={() => setIsSortOpen(false)}
                      className="w-full border-2 border-[#EB61A2] text-[#EB61A2] text-[1.3rem] font-bold py-3 rounded-xl hover:bg-[#EB61A2] hover:text-white transition"
                    >
                      VIEW ITEMS
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img src="/assets/ProductsSortByAndFilterIcons/for filter.svg" alt="Filter" className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10 w-6 h-6" />
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-48 h-12 pl-5 pr-10 rounded-xl border-2 border-[#eb61a1] bg-transparent text-2xl text-[#eb61a1] cursor-pointer focus:outline-none focus:border-[#eb61a1] focus:ring-4 focus:ring-pink-100 transition"
              >
                Filter
              </button>
              {/* Backdrop */}
              {isFilterOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-[10001]"
                  onClick={() => setIsFilterOpen(false)}
                />
              )}
              <div className={`fixed top-0 left-0 w-[30vw] h-screen bg-white border-r shadow-lg z-[10002] transition-transform duration-500 ease-out ${isFilterOpen ? 'translate-x-0' : 'translate-x-[-100%]'}`}>
                <div className="p-4 relative h-full flex flex-col">
                  <div className="relative mb-4 -mx-4 px-4 -mt-4 pt-4 pb-2 bg-[#EB61A2]">
                    <button
                      onClick={() => setIsFilterOpen(false)}
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
                  <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                    <div
                      onClick={() => {
                        setSelectedCategory("");
                        setIsFilterOpen(false);
                      }}
                      className="px-4 text-[1.3rem] py-3 hover:bg-gray-100 cursor-pointer rounded border-b border-black -mx-4 px-4"
                    >
                      All
                    </div>
                    {categories.map((cat) => (
                      <div
                        key={cat?.id}
                        onClick={() => {
                          setSelectedCategory(cat?.id);
                          setIsFilterOpen(false);
                        }}
                        className="px-4 text-[1.3rem] py-3 hover:bg-gray-100 cursor-pointer rounded border-b border-black -mx-4 px-4"
                      >
                        {cat?.name || "Unnamed Category"}
                      </div>
                    ))}
                  </div>
                  <div className="p-4">
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="w-full border-2 border-[#EB61A2] text-[#EB61A2] text-[1.3rem] font-bold py-3 rounded-xl hover:bg-[#EB61A2] hover:text-white transition"
                    >
                      VIEW ITEMS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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