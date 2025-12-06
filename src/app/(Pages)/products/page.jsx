// src/app/products/page.tsx   ← must be this exact path

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import axiosAuth from "../../../app/lib/api/axiosConfig";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";

import { FaCartPlus, FaHeart, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import useAuthContext from "../../../app/lib/Authentication/AuthContext";
import Loading from "../../../Components/Loading/Loading";
import useUserActions from "../../../Components/Hooks/userUserActions";


const ThirdImage = "/assets/third_image.png";

const Products = () => {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

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
  }, []);

  /* ------------------- HANDLERS ------------------- */
  const handleAddToCart = async (productId) => {
    await addToCart(productId, 1);
  };

  const handleFavorite = async (productId) => {
    await addToFavorite(productId);
  };

  /* ------------------- FILTER & GROUP PRODUCTS ------------------- */
  const getGroupedAndFilteredProducts = () => {
    let filtered = products;

    // Filter by search term first
    if (searchTerm) {
      filtered = filtered.filter((p) => 
        p?.name?.toLowerCase().includes(searchTerm.toLowerCase()) 
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
      <main className="pt-[9rem] px-4 sm:px-6 pb-16 bg-white font-[Poppins,sans-serif]">
        {/* ===== Filter Section ===== */}
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-[#eb61a2]">Our Products</h1>
          <div className="flex flex-wrap items-center gap-4 mt-6 lg:mt-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-3 px-5 rounded-xl border-2 border-gray-300 text-base cursor-pointer focus:outline-none focus:border-[#eb61a2] focus:ring-4 focus:ring-pink-100 transition"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat?.id} value={cat?.id}>
                  {cat?.name || "Unnamed Category"}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-3 px-5 rounded-xl border-2 border-gray-300 text-base placeholder-gray-500 focus:outline-none focus:border-[#eb61a2] focus:ring-4 focus:ring-pink-100 transition"
            />
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
                  {productsInCategory.map((p) => (
                    <div
                      key={p?.id}
                      className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-4 flex flex-col justify-between transition-[transform_0.3s_ease,box-shadow_0.3s_ease] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-[100]"
                    >
                      {/* Image Container */}
                      <div className="relative">
                        <Image
                          src={
                            p?.images?.[0]?.downloadUrl
                              ? `https://backend.skinme.store${p.images[0].downloadUrl}`
                              : ThirdImage
                          }
                          alt={p?.name || "Product"}
                          width={400}
                          height={400}
                          className="w-full h-[200px] object-cover rounded-2xl cursor-pointer transition-transform duration-300 hover:scale-105 max-[600px]:h-[200px]"
                          onClick={() => router.push(`/product_details?productId=${p.id}`)}
                        />
                        <button
                          onClick={() => handleFavorite(p.id)}
                          className="absolute top-2 right-2 bg-white/85 rounded-full p-1.5 text-[#f56565] text-base cursor-pointer transition-[background_0.2s] hover:bg-[#fed7d7]"
                        >
                          <FaHeart />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="flex flex-col justify-between px-3 py-2.5 flex-grow z-[100]">
                        <div>
                          <h3 className="text-base font-semibold text-left text-[#2d3748] leading-tight overflow-hidden text-ellipsis whitespace-nowrap max-[600px]:text-base">
                            {p?.name || "No Name"}
                          </h3>
                          <p className="flex justify-center text-base font-bold text-left text-[#2563eb] my-1.5 max-[600px]:text-sm">
                            ${p?.price ?? "N/A"}
                          </p>
                        </div>

                        <button
                          onClick={() => handleAddToCart(p.id)}
                          className="mt-auto bg-[#d13e82] border-none rounded-xl px-5 py-2.5 text-white font-semibold cursor-pointer flex items-center justify-center gap-2 text-[0.95rem] shadow-[0_4px_12px_rgba(209,62,130,0.3)] transition-all duration-300 hover:bg-[#c32c70] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_6px_15px_rgba(209,62,130,0.4)] active:-translate-y-px active:scale-[0.98] active:shadow-[0_4px_10px_rgba(209,62,130,0.3)] z-[100]"
                        >
                          <FaCartPlus className="text-[1.1rem] transition-transform duration-300" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
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