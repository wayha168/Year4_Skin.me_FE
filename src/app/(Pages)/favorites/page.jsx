// FavoritePage.jsx
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "../../../api/axiosConfig";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import useAuthContext from "../../../Authentication/AuthContext";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";

const ThirdImage = "/assets/third_image.png";

const FavoritePage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  const { user } = useAuthContext();
  const router = useRouter();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      router.push("/login?redirect=/favorites&showLoginPopup=true");
    }
  }, [userId, router]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        const { data } = await axios.get(`/favorites/user/${userId}`, {
          withCredentials: true,
        });
        setFavorites(data?.data || []);
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setNotification("Failed to load favorites");
        setTimeout(() => setNotification(""), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [userId]);

  const handleRemoveFavorite = async (productId) => {
    if (!userId) return;

    try {
      await axios.delete("/favorites/remove", {
        params: { userId, productId },
        withCredentials: true,
      });

      setFavorites((prev) => prev.filter((f) => f.product.id !== productId));
      setNotification("Removed from favorites");
      setTimeout(() => setNotification(""), 2000);
    } catch (err) {
      console.error("Error removing favorite:", err);
      setNotification("Failed to remove favorite");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const handleProductClick = (productId) => {
    router.push(`/product_details?productId=${productId}`);
  };

  const getProductImage = (fav) => {
    const imageUrl = fav?.productThumbnailUrl || fav?.product?.images?.[0]?.downloadUrl;

    return imageUrl
      ? `https://backend.skinme.store${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`
      : ThirdImage;
  };

  return (
    <>
      <Navbar />

      {notification && (
        <div className="fixed top-20 right-[30px] bg-[#ff0011] text-white font-semibold px-5 py-2.5 rounded-[10px] z-[9999] shadow-[0_4px_10px_rgba(0,0,0,0.2)] animate-[fadeInOut_3s_ease]">
          {notification}
        </div>
      )}

      <main className="pt-24 px-6 pb-16 bg-white font-[Poppins,sans-serif]">
        <div className="max-w-7xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-[#eb61a2]">My Favorites</h1>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 text-lg mt-20">
            <i className="fa fa-spinner fa-spin mr-2" />
            Loading your favorites...
          </p>
        ) : favorites.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-20">You have no favorite products yet.</p>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {favorites.map((fav) => {
              const product = fav.product;
              if (!product) return null;

              return (
                <div
                  key={product.id}
                  className="product-card bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                >
                  {/* Image Container */}
                  <div
                    className="product-img-container relative overflow-hidden cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <Image
                      src={getProductImage(fav)}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="product-img w-full h-64 object-cover rounded-t-xl transition-transform duration-300 hover:scale-105"
                      onError={(e) => (e.currentTarget.src = ThirdImage)}
                    />
                  </div>

                  {/* Info */}
                  <div className="product-info flex flex-col justify-between p-5 flex-grow">
                    <div>
                      <h3 className="product-name text-lg font-semibold text-gray-800 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.brand && (
                        <p className="text-base text-[#666] mt-2">{product.brand}</p>
                      )}
                      <p className="product-price text-xl font-bold text-[#2563eb] mt-2">
                        ${Number(product.price ?? 0).toFixed(2)}
                      </p>
                      {product.description && (
                        <p className="text-sm text-[#777] mt-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveFavorite(product.id)}
                      className="mt-5 w-full bg-gradient-to-br from-[#d13e82] to-[#fcb8c2] text-white font-semibold py-3 px-4 rounded-xl shadow-[0_4px_12px_rgba(209,62,130,0.3)] transition-all duration-300 hover:from-[#c32c70] hover:to-[#f9a0b0] hover:shadow-[0_6px_15px_rgba(209,62,130,0.4)] hover:-translate-y-1 flex items-center justify-center gap-2"
                      title="Remove from favorites"
                    >
                      <i className="fa-solid fa-trash text-xl" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <MessageWidget />

      <style jsx>{`
        @keyframes fadeInOut {
          0%, 80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default FavoritePage;