import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../Components/Navbar/Navbar.jsx";
import Footer from "../../Components/Footer/Footer.jsx";
import axios from "../../api/axiosConfig";
import useUserActions from "../../Components/Hooks/userUserActions.js";
import useAuthContext from "../../Authentication/AuthContext.jsx";
import LoginFirst from "../../Components/LoginFirst/LoginFirst.js";
import MessageWidget from "../../Components/MessageWidget/MessageWidget.jsx";

import MainImage from "../../assets/product_homepage.png";
import FirstImage from "../../assets/first_image.png";
import SecondImage from "../../assets/second_image.png";
import ThirdImage from "../../assets/third_image.png";

import { FaCartPlus, FaHeart } from "react-icons/fa";

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { addToCart, addToFavorite } = useUserActions();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loginFirst = new LoginFirst(user, navigate);

  const scrollToProducts = () => {
    const section = document.getElementById("product");
    if (section) {
      const navbarHeight = document.querySelector(".navbar-wrapper")?.offsetHeight || 0;
      const y = section.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (location.state?.scrollTo === "product") scrollToProducts();
  }, [location]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("/products/all", { withCredentials: true });
        setProducts(res?.data?.data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleFavoriteClick = async (productId) => {
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

  const handleAddToCartClick = async (productId) => {
    if (!user) {
      const message = loginFirst.messages.loginRequiredCart;
      loginFirst.safeNavigate("/login", {
        state: {
          showLoginPopup: true,
          redirectTo: window.location.pathname,
          popupMessage: message,
        },
      });
      return;
    }
    await addToCart(productId, 1);
  };

  return (
    <>
      <Navbar alwaysVisible={true} />

      {/* HERO SECTION */}
      <div className="relative flex flex-col lg:flex-row items-center justify-center min-h-screen bg-gradient-to-b from-pink-100 to-pink-300 mt-16 overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute -left-96 top-16 w-96 h-96 bg-purple-400 rounded-full -z-10"></div>
        <div className="absolute -right-96 top-80 w-96 h-96 bg-purple-400 rounded-full -z-10"></div>

        <div className="w-full lg:w-3/5 flex flex-col justify-center items-start px-8 lg:pl-32 z-10">
          <p className="text-3xl font-medium text-pink-500 mb-4">Welcome to SKIN.ME</p>
          <h1 className="text-5xl font-semibold text-white mb-4">Most Essential Skin Care Product</h1>
          <p className="text-xl text-gray-700 mb-8">Give you the best skincare products is our mission.</p>
          <button
            onClick={scrollToProducts}
            className="bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white text-2xl font-semibold py-4 px-12 rounded-2xl transition-all duration-200"
          >
            Shop Now
          </button>
        </div>

        <div className="w-full lg:w-2/5 flex justify-center lg:justify-end -mt-20 lg:mt-0">
          <img src={MainImage} alt="skin product" className="h-[50rem] object-contain" />
        </div>
      </div>

      {/* OVERVIEW SECTION */}
      <div className="flex flex-col lg:flex-row items-center justify-center py-20 px-8 gap-16 bg-gradient-to-b from-transparent to-pink-50">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg">
          <h2 className="text-4xl font-bold text-pink-500 mb-4">Let's Have A Look</h2>
          <p className="text-2xl text-gray-800 mb-8">
            This is the overview about our products that you can spend a few minutes to see how they look.
          </p>
          <div className="flex gap-8 -mb-32 lg:-mb-44 z-10">
            <img src={FirstImage} alt="" className="w-64 h-64 object-cover rounded-lg shadow-xl" />
            <img src={SecondImage} alt="" className="w-64 h-64 object-cover rounded-lg shadow-xl" />
          </div>
        </div>
        <div className="relative">
          <img src={ThirdImage} alt="" className="w-full max-w-2xl rounded-lg shadow-2xl -mt-20 lg:-mt-32" />
        </div>
        <div className="absolute -left-80 top-full w-96 h-96 bg-purple-400 rounded-full -z-10 hidden lg:block"></div>
      </div>

      {/* PRODUCTS SECTION */}
      <section id="product" className="py-20 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-12 px-5">
            <h2 className="text-4xl lg:text-5xl text-pink-500 font-bold uppercase">Product</h2>
            <button
              onClick={() => navigate("/products")}
              className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-3xl text-xl font-medium transition-all duration-200 mt-6 sm:mt-0"
            >
              All Product
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 text-lg mt-20">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500 text-lg mt-20">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {products.slice(0, 10).map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        p?.images?.[0]?.downloadUrl
                          ? `https://backend.skinme.store${p.images[0].downloadUrl}`
                          : ThirdImage
                      }
                      alt={p.name}
                      className="w-full h-64 object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
                      onClick={() => navigate("/check_out", { state: { product: p } })}
                    />
                    <button
                      onClick={() => handleFavoriteClick(p.id)}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-pink-100 text-red-500 p-2 rounded-full transition-colors"
                    >
                      <FaHeart className="text-lg" />
                    </button>
                  </div>

                  <div className="p-5 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{p.name}</h3>
                      <p className="text-2xl font-bold text-pink-500 mt-2">${p.price}</p>
                    </div>
                    <button
                      onClick={() => handleAddToCartClick(p.id)}
                      className="mt-6 w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-98 transition-all duration-300"
                    >
                      <FaCartPlus className="text-lg" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <div className="bg-pink-100 py-20 px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-pink-600 mb-6">About Us</h2>
          <p className="text-xl lg:text-2xl text-gray-700 mb-12">
            SKIN.ME is more than skincare — it's a daily ritual of self-respect and renewal. We craft minimalist, effective formulas designed for real skin and real lives.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[FirstImage, SecondImage, ThirdImage, FirstImage].map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className="w-full max-w-sm h-72 object-cover rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
            />
          ))}
        </div>
      </div>

      <Footer />
      <MessageWidget />
    </>
  );
};

export default HomePage;