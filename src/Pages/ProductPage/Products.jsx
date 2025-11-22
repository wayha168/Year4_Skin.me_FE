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
  const filteredProducts = products.filter((p) =>
    p?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  return (
    <>
      <Navbar alwaysVisible={true} />
      <main className="pt-24 px-6 pb-16 bg-white font-[Poppins,sans-serif]">
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
                <option key={cat?.id} value={cat?.name}>
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

        {/* ===== Product Grid - NOW 5 COLUMNS ON LARGE SCREENS ===== */}
        {loading ? (
          <Loading />
        ) : currentProducts.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-20">No products found.</p>
        ) : (
          <>
            <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {currentProducts.map((p) => (
                <div
                  key={p?.id}
                  className="product-card bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                >
                  {/* Image Container */}
                  <div className="product-img-container relative overflow-hidden">
                    <img
                      src={
                        p?.images?.[0]?.downloadUrl
                          ? `https://backend.skinme.store${p.images[0].downloadUrl}`
                          : ThirdImage
                      }
                      alt={p?.name || "Product"}
                      className="product-img w-full h-64 object-cover rounded-t-xl cursor-pointer transition-transform duration-300 hover:scale-105"
                      onClick={() => navigate("/product_details", { state: { product: p } })}
                    />
                    <button
                      onClick={() => handleFavorite(p.id)}
                      className="favorite-btn absolute top-3 right-3 bg-white/85 text-red-500 p-2 rounded-full text-lg transition-all hover:bg-pink-100 hover:scale-110"
                    >
                      <FaHeart />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="product-info flex flex-col justify-between p-5 flex-grow">
                    <div>
                      <h3 className="product-name text-lg font-semibold text-gray-800 line-clamp-2">
                        {p?.name || "No Name"}
                      </h3>
                      <p className="product-price text-xl font-bold text-[#2563eb] mt-2">
                        ${p?.price ?? "N/A"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddToCart(p.id)}
                      className="add-to-cart mt-5 w-full bg-[#d13e82] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(209,62,130,0.3)] transition-all duration-300 hover:bg-[#c32c70] hover:shadow-[0_6px_15px_rgba(209,62,130,0.4)] hover:-translate-y-1 active:scale-98"
                    >
                      <FaCartPlus className="text-lg" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination - unchanged */}
            <div className="flex justify-center items-center gap-3 mt-16 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-gray-600 transition-all hover:border-[#eb61a2] hover:text-[#eb61a2] hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft />
              </button>

              {(() => {
                const pages = [];
                const start = Math.max(1, currentPage - 2);
                const end = Math.min(totalPages, currentPage + 2);

                if (start > 1) {
                  pages.push(
                    <button key={1} onClick={() => setCurrentPage(1)} className="w-11 h-11 rounded-full bg-white border-2 border-gray-300 text-gray-700 hover:border-[#eb61a2] hover:text-[#eb61a2]">
                      1
                    </button>
                  );
                  if (start > 2) pages.push(<span key="start-ellipsis" className="text-gray-500">…</span>);
                }

                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-11 h-11 rounded-full font-medium transition-all ${
                        currentPage === i
                          ? "bg-[#eb61a2] text-white border-2 border-[#eb61a2] scale-110 shadow-lg"
                          : "bg-white border-2 border-gray-300 text-gray-700 hover:border-[#eb61a2] hover:text-[#eb61a2]"
                      }`}
                    >
                      {i}
                    </button>
                  );
                }

                if (end < totalPages) {
                  if (end < totalPages - 1) pages.push(<span key="end-ellipsis" className="text-gray-500">…</span>);
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-11 h-11 rounded-full bg-white border-2 border-gray-300 text-gray-700 hover:border-[#eb61a2] hover:text-[#eb61a2]"
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
                className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center text-gray-600 transition-all hover:border-[#eb61a2] hover:text-[#eb61a2] hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
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