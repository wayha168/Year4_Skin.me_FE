// src/pages/Products.jsx  (or wherever you keep it)
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
import "./Products.css"; // <-- keep your Products-specific CSS

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
      <main className="products-section ">
        {/* ===== Filter Section ===== */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">🛍️ Our Products</h1>

          <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
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
              className="sort-select"
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
            <div className="products-grid">
              {currentProducts.map((p) => (
                <div key={p?.id} className="product-card">
                  <div className="product-img-container">
                    <img
                      src={
                        p?.images?.[0]?.downloadUrl
                          ? `https://backend.skinme.store${p.images[0].downloadUrl}`
                          : ThirdImage
                      }
                      alt={p?.name || "Product Image"}
                      className="product-img"
                      onClick={() => navigate("/product_details", { state: { product: p } })}
                    />
                    <button className="favorite-btn" onClick={() => handleFavorite(p.id)}>
                      <FaHeart />
                    </button>
                  </div>

                  <div className="product-info">
                    <h3 className="product-name">{p?.name || "No Name"}</h3>
                    <p className="product-desc line-clamp-2">{p?.description || "No description"}</p>
                    <p className="product-price">${p?.price ?? "N/A"}</p>

                    <button className="add-to-cart" onClick={() => handleAddToCart(p.id)}>
                      <FaCartPlus /> Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="pagination-wrapper">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn prev-next"
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
                    <button key={1} onClick={() => setCurrentPage(1)} className="pagination-btn page-num">
                      1
                    </button>
                  );
                  if (start > 2)
                    pages.push(
                      <span key="start-ellipsis" className="ellipsis">
                        …
                      </span>
                    );
                }

                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`pagination-btn page-num ${currentPage === i ? "active" : ""}`}
                    >
                      {i}
                    </button>
                  );
                }

                if (end < totalPages) {
                  if (end < totalPages - 1)
                    pages.push(
                      <span key="end-ellipsis" className="ellipsis">
                        …
                      </span>
                    );
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="pagination-btn page-num"
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
                className="pagination-btn prev-next"
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
