// src/pages/Products.jsx
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "../../api/axiosConfig";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import ThirdImage from "../../assets/third_image.png";
import { FaCartPlus, FaHeart, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import useAuthContext from "../../Authentication/AuthContext";
import Loading from "../../Components/Loading/Loading";
import useUserActions from "../../Components/Hooks/userUserActions";
import LoginFirst from "../../Components/LoginFirst/LoginFirst.js";
import MessageWidget from "../../Components/MessageWidget/MessageWidget.jsx";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 15;

  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { addToCart, addToFavorite } = useUserActions();
  const loginFirst = new LoginFirst(user, navigate);

  /* ------------------- FETCH CATEGORIES ------------------- */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/categories/all-categories");
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
        let res;
        if (selectedCategory) {
          res = await axios.get(`/products/by-category/${selectedCategory}`);
        } else {
          res = await axios.get("/products/all");
        }
        setProducts(res?.data?.data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory]);

  /* ------------------- HANDLERS ------------------- */
  const handleAddToCart = async (productId) => {
    if (!user) {
      loginFirst.redirectToCart();
      return;
    }
    const success = await addToCart(productId, 1);
    if (success) loginFirst.redirectToCart(true);
  };

  const handleFavorite = async (productId) => {
    if (!user) {
      const message = loginFirst.messages.loginRequiredFavorite;
      loginFirst.safeNavigate("/login", {
        state: {
          showLoginPopup: true,
          redirectTo: window.location.pathname,
          popupMessage: message,
        },
      });
      return;
    }
    await addToFavorite(productId);
  };

  /* ------------------- FILTER & PAGINATION ------------------- */
  const filteredProducts = products.filter((p) => p?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  /* ------------------- RENDER ------------------- */
  return (
    <>
      <Navbar alwaysVisible={true} />
      <main className="pt-24 px-12 pb-16 bg-[#fafafa] font-[Poppins,sans-serif]">
        {/* ===== Filter Section ===== */}
        <div className="flex flex-wrap justify-between items-center mb-12">
          <h1 className="text-[2.2rem] font-semibold text-[#d13e82]">🛍️ Our Products</h1>

          <div className="flex flex-wrap items-center gap-4 max-[900px]:pt-12">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-4 rounded-[6px] border-2 border-[#989898] text-base cursor-pointer transition-[border] duration-200 ease-[ease] focus:outline-none focus:border-[#d13e82] focus:shadow-[0_0_6px_rgba(209,62,130,0.3)]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat?.id} value={cat?.name}>
                  {cat?.name || "Unnamed Category"}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="🔍 Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-2 px-4 rounded-[6px] border-2 border-[#989898] text-base cursor-pointer transition-[border] duration-200 ease-[ease] h-[2.4rem] focus:outline-none focus:border-[#d13e82] focus:shadow-[0_0_6px_rgba(209,62,130,0.3)]"
            />
          </div>
        </div>

        {/* ===== Product Grid ===== */}
        {loading ? (
          <Loading />
        ) : currentProducts.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-10">No products found.</p>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 [&:has(>*:only-child)]:justify-center [&:has(>*:only-child)]:grid-cols-[20rem] [&:has(>*:only-child)>*]:w-[20rem] [&:has(>*:only-child)>*]:h-full [&:has(>*:nth-child(1)):has(>*:nth-child(2)):not(:has(>*:nth-child(3)))]:justify-center [&:has(>*:nth-child(1)):has(>*:nth-child(2)):not(:has(>*:nth-child(3)))]:grid-cols-[repeat(2,20rem)] [&:has(>*:nth-child(1)):has(>*:nth-child(2)):not(:has(>*:nth-child(3)))>*]:w-[20rem] [&:has(>*:nth-child(1)):has(>*:nth-child(2)):not(:has(>*:nth-child(3)))>*]:h-full [&:has(>*:nth-child(1)):has(>*:nth-child(2)):has(>*:nth-child(3)):not(:has(>*:nth-child(4)))]:justify-center [&:has(>*:nth-child(1)):has(>*:nth-child(2)):has(>*:nth-child(3)):not(:has(>*:nth-child(4)))]:grid-cols-[repeat(3,1fr)] [&:has(>*:nth-child(1)):has(>*:nth-child(2)):has(>*:nth-child(3)):not(:has(>*:nth-child(4)))]:gap-6 [&:has(>*:nth-child(1)):has(>*:nth-child(2)):has(>*:nth-child(3)):has(>*:nth-child(4)):not(:has(>*:nth-child(5)))]:justify-center [&:has(>*:nth-child(1)):has(>*:nth-child(2)):has(>*:nth-child(3)):has(>*:nth-child(4)):not(:has(>*:nth-child(5)))]:grid-cols-[repeat(4,1fr)] [&:has(>*:nth-child(1)):has(>*:nth-child(2)):has(>*:nth-child(3)):has(>*:nth-child(4)):not(:has(>*:nth-child(5)))]:gap-6">
              {currentProducts.map((p) => (
                <div key={p?.id} className="bg-white rounded-[15px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition-all duration-[0.25s] ease-[ease] flex flex-col hover:translate-y-[-6px] hover:shadow-[0_6px_18px_rgba(0,0,0,0.15)]">
                  <div className="relative w-full aspect-square overflow-hidden">
                    <img
                      src={
                        p?.images?.[0]?.downloadUrl
                          ? `https://backend.skinme.store${p.images[0].downloadUrl}`
                          : ThirdImage
                      }
                      alt={p?.name || "Product Image"}
                      className="w-full h-full object-cover transition-transform duration-300 ease-[ease] hover:scale-105"
                      onClick={() => navigate("/product_details", { state: { product: p } })}
                    />
                    <button 
                      className="absolute top-[10px] right-[10px] bg-[rgba(255,255,255,0.9)] border-none rounded-full py-[6px] px-2 cursor-pointer text-base transition-all duration-200 ease-[ease] hover:bg-[#d13e82] hover:text-white" 
                      onClick={() => handleFavorite(p.id)}
                    >
                      <FaHeart />
                    </button>
                  </div>

                  <div className="p-4 text-center flex flex-col gap-2">
                    <h3 className="text-[1.2rem] font-semibold text-[#333]">{p?.name || "No Name"}</h3>
                    <p className="text-[0.95rem] text-[#777] mb-[0.8rem] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box] overflow-hidden text-ellipsis min-h-[2.4rem]">
                      {p?.description || "No description"}
                    </p>
                    <p className="text-base font-semibold text-[#d13e82]">${p?.price ?? "N/A"}</p>

                    <button 
                      className="bg-[#d13e82] text-white py-2 px-4 rounded-lg border-none cursor-pointer transition-all duration-300 ease-[ease] flex items-center justify-center gap-2 hover:bg-[#b83570]" 
                      onClick={() => handleAddToCart(p.id)}
                    >
                      <FaCartPlus /> Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-3 mt-12 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-12 h-12 rounded-full text-base font-semibold transition-all duration-300 ease-[ease] bg-white border-2 border-[#e2e8f0] text-[#64748b] cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:translate-y-[-3px] hover:scale-110 hover:shadow-[0_6px_12px_rgba(0,0,0,0.1)] hover:border-[#eb61a2] hover:text-[#eb61a2] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-[1.1rem]"
                aria-label="Previous page"
              >
                <FaChevronLeft />
              </button>

              {(() => {
                const pages = [];
                const start = Math.max(1, currentPage - 3);
                const end = Math.min(totalPages, currentPage + 3);

                if (start > 1) {
                  pages.push(
                    <button 
                      key={1} 
                      onClick={() => setCurrentPage(1)} 
                      className="flex items-center justify-center w-11 h-11 rounded-full text-base font-semibold transition-all duration-300 ease-[ease] bg-white border-2 border-[#e2e8f0] text-[#64748b] cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:translate-y-[-3px] hover:scale-110 hover:shadow-[0_6px_12px_rgba(0,0,0,0.1)] hover:border-[#eb61a2] hover:text-[#eb61a2]"
                    >
                      1
                    </button>
                  );
                  if (start > 2)
                    pages.push(
                      <span key="start-ellipsis" className="text-[#94a3b8] font-semibold px-2">
                        …
                      </span>
                    );
                }

                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`flex items-center justify-center w-11 h-11 rounded-full text-base font-semibold transition-all duration-300 ease-[ease] cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:translate-y-[-3px] hover:scale-110 hover:shadow-[0_6px_12px_rgba(0,0,0,0.1)] hover:border-[#eb61a2] hover:text-[#eb61a2] ${
                        currentPage === i 
                          ? "bg-[#eb61a2] text-white border-[#eb61a2] shadow-[0_4px_10px_rgba(235,97,162,0.3)] scale-105 border-2" 
                          : "bg-white border-2 border-[#e2e8f0] text-[#64748b]"
                      }`}
                    >
                      {i}
                    </button>
                  );
                }

                if (end < totalPages) {
                  if (end < totalPages - 1)
                    pages.push(
                      <span key="end-ellipsis" className="text-[#94a3b8] font-semibold px-2">
                        …
                      </span>
                    );
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="flex items-center justify-center w-11 h-11 rounded-full text-base font-semibold transition-all duration-300 ease-[ease] bg-white border-2 border-[#e2e8f0] text-[#64748b] cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:translate-y-[-3px] hover:scale-110 hover:shadow-[0_6px_12px_rgba(0,0,0,0.1)] hover:border-[#eb61a2] hover:text-[#eb61a2]"
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pages;
              })()}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center w-12 h-12 rounded-full text-base font-semibold transition-all duration-300 ease-[ease] bg-white border-2 border-[#e2e8f0] text-[#64748b] cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:translate-y-[-3px] hover:scale-110 hover:shadow-[0_6px_12px_rgba(0,0,0,0.1)] hover:border-[#eb61a2] hover:text-[#eb61a2] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-[1.1rem]"
                aria-label="Next page"
              >
                <FaChevronRight />
              </button>
            </div>
          </>
        )}
      </main>

      <Footer />
      <MessageWidget />
    </>
  );
};

export default Products;