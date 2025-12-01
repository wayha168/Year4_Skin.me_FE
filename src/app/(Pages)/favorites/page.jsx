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
import { FaShoppingBag } from "react-icons/fa";

const ThirdImage = "/assets/third_image.png";

const FavoritePage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const userId = user?.id;

  // Redirect if not authenticated (only after auth has finished loading)
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/favorites");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !userId) {
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
  }, [userId, authLoading]);

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

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <i className="fa fa-spinner fa-spin text-4xl text-[#eb61a2]" />
      </div>
    );
  }

  // Don't render page if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar alwaysVisible={true} />

      {notification && (
        <div className="fixed top-20 right-[30px] bg-[#ff0011] text-white font-semibold px-5 py-2.5 rounded-[10px] z-[9999] shadow-[0_4px_10px_rgba(0,0,0,0.2)] animate-[fadeInOut_3s_ease]">
          {notification}
        </div>
      )}

      <main className="pt-[9rem] px-4 sm:px-6 pb-16 bg-white font-[Poppins,sans-serif]">
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
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 z-[1]">
              {favorites.map((fav) => {
                const product = fav.product;
                if (!product) return null;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-4 flex flex-col justify-between transition-[transform_0.3s_ease,box-shadow_0.3s_ease] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-[100]"
                  >
                    {/* Image Container */}
                    <div className="relative">
                      <Image
                        onClick={() => handleProductClick(product.id)}
                        src={getProductImage(fav)}
                        alt={product.name}
                        width={400}
                        height={400}
                        className="w-full h-[200px] object-cover rounded-2xl cursor-pointer transition-transform duration-300 hover:scale-105 max-[600px]:h-[200px]"
                        onError={(e) => (e.currentTarget.src = ThirdImage)}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-between px-3 py-2.5 flex-grow z-[100]">
                      <div>
                        <h3 className="text-base font-semibold text-left text-[#2d3748] leading-tight overflow-hidden text-ellipsis whitespace-nowrap max-[600px]:text-base">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-sm text-gray-600 text-center mt-1">
                            {product.brand}
                          </p>
                        )}
                        <p className="flex justify-center text-base font-bold text-left text-[#2563eb] my-1.5 max-[600px]:text-sm">
                          ${Number(product.price ?? 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => router.push("/check_out")}
                          className="mt-auto bg-[#d13e82] border-none rounded-xl px-5 py-2.5 text-white font-semibold cursor-pointer flex items-center justify-center gap-2 text-[0.95rem] shadow-[0_4px_12px_rgba(209,62,130,0.3)] transition-all duration-300 hover:bg-[#c32c70] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_6px_15px_rgba(209,62,130,0.4)] active:-translate-y-px active:scale-[0.98] active:shadow-[0_4px_10px_rgba(209,62,130,0.3)] z-[100]"
                        >
                          <FaShoppingBag className="text-[1.1rem] transition-transform duration-300" />
                          Check Out
                        </button>
                        <button
                          onClick={() => handleRemoveFavorite(product.id)}
                          className="text-[#d13e82] font-medium hover:underline text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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