// OPTIMIZED FAVORITE PAGE - Fast Render
// ============================================
"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axiosAuth from "../../../app/lib/api/axiosConfig";

import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import useAuthContext from "../../../app/lib/Authentication/AuthContext";
import useUserActions from "../../../Components/Hooks/userUserActions";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";
import { FaCartPlus, FaHeart } from "react-icons/fa";
import { getProductImageUrl } from "../../../app/lib/productImage";
import { formatPrice } from "../../../app/lib/formatPrice";

const ThirdImage = "/assets/third_image.png";

const FavoritePage = () => {
  const [favorites, setFavorites] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  const { user, loading: authLoading } = useAuthContext();
  const { addToCart, addToFavorite } = useUserActions();
  const router = useRouter();
  const userId = user?.id;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
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
        const { data } = await axiosAuth.get(`/favorites/user/${userId}`, {
          withCredentials: true,
        });
        const favs = data?.data || [];
        setFavorites(favs);

        // Fetch recommended products from same brand
        if (favs.length > 0) {
          const firstProduct = favs[0].product;
          const brandId = firstProduct?.brand?.id;
          const brandName = typeof firstProduct?.brand === "string" ? firstProduct.brand : firstProduct?.brand?.name;

          try {
            const res = await axiosAuth.get("/products/all");
            const allProducts = res.data?.data || [];
            const recommended = allProducts
              .filter(p => {
                if (p.id === firstProduct.id) return false;
                const pBrandId = p.brand?.id;
                const pBrandName = typeof p.brand === "string" ? p.brand : p.brand?.name;
                return (brandId && pBrandId === brandId) || (brandName && pBrandName === brandName);
              })
              .slice(0, 5);
            setRecommendedProducts(recommended);
          } catch (e) {
            console.error("Failed to fetch recommended products");
          }
        } else {
          setRecommendedProducts([]);
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);

        if (err.response?.status === 404) {
          setFavorites([]);
        } else if (err.response?.status === 401) {
          router.replace(
            "/login?redirect=/favorites&message=" + encodeURIComponent("Session expired. Please login again")
          );
        } else {
          setNotification("Failed to load favorites");
          setTimeout(() => setNotification(""), 3000);
          setFavorites([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [userId, authLoading, router]);

  const handleRemoveFavorite = useCallback(
    async (productId) => {
      if (!userId) return;

      try {
        await axiosAuth.delete("/favorites/remove", {
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
    },
    [userId]
  );

  const handleProductClick = useCallback(
    (productId) => {
      router.push(`/product_details?productId=${productId}`);
    },
    [router]
  );

  const handleCheckout = useCallback(() => {
    router.push("/check_out");
  }, [router]);

  const handleAddToCartFromFavorite = useCallback(async (productId) => {
    await addToCart(productId, 1);
  }, [addToCart]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <i className="fa fa-spinner fa-spin text-4xl text-[#eb61a2]" />
      </div>
    );
  }

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

      <main className="pt-[5rem] px-0 pb-16 bg-[#F7F7F7] font-[Poppins,sans-serif]">
        {/* ===== Hero Section ===== */}
        <div className="w-full mb-[2rem] -mt-[4.5rem]">
          <h1 className="mt-[12px] w-full h-[9rem] flex items-end justify-center max-[750px]:justify-end text-4xl font-bold  bg-[#F7F7F7] text-[#EB61A2] pb-[13px] max-[750px]:pr-4 max-[750px]:text-[1.8rem]">
            Favorites
          </h1>
        </div>

        <div className="px-4 sm:px-6">
          <div className="max-w-7xl mx-auto mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight">My Favorite</h1>
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

                const imgSrc = fav?.productThumbnailUrl
                  ? (fav.productThumbnailUrl.startsWith("http") ? fav.productThumbnailUrl : (fav.productThumbnailUrl.startsWith("/") ? fav.productThumbnailUrl : `/${fav.productThumbnailUrl}`))
                  : getProductImageUrl(fav?.product, ThirdImage);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-[100]"
                  >
                    <div className="relative h-[200px] bg-gray-100">
                      <Image
                        src={imgSrc}
                        alt={product.name}
                        fill
                        className="object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                        sizes="(max-width: 600px) 50vw, 200px"
                        unoptimized
                        onClick={() => handleProductClick(product.id)}
                        onError={(e) => (e.currentTarget.src = ThirdImage)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(product.id)}
                        className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-[#e53e3e] hover:bg-red-50 transition-colors"
                      >
                        <FaHeart className="text-sm" />
                      </button>
                    </div>

                    <div className="flex flex-col flex-1 p-4 gap-1 min-w-0 text-center">
                      {(product.brand != null) && (
                        <span className="opacity-70 text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                          {typeof product.brand === "object" ? product.brand?.name : product.brand}
                        </span>
                      )}
                      <h3 className="text-[1.15rem] font-bold text-gray-800 truncate" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate opacity-80" title={product.description}>
                        {product.description?.trim() || "No description"}
                      </p>
                      <p className="text-sm font-bold text-black mt-1">
                        {formatPrice(product.price)}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleAddToCartFromFavorite(product.id)}
                        className="mt-3 w-full bg-[#d13e82] text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#c32c70] transition-colors"
                      >
                        <FaCartPlus className="text-base" /> Add to Cart
                      </button>
                      <button
                        onClick={() => handleRemoveFavorite(product.id)}
                        className="relative flex items-center justify-center gap-1.5 text-[#d13e82] font-medium text-sm mt-1 transition-all duration-200 hover:scale-[1.02] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#d13e82] after:transition-all after:duration-300 hover:after:w-full"
                      >
                        <Image  className="mt-[1rem]"
                          src="/assets/DeleteFavorite/DeleteIcon.svg" 
                          alt="Delete" 
                          width={12} 
                          height={12} 
                          className="[filter:brightness(0)_saturate(100%)_invert(42%)_sepia(93%)_saturate(1352%)_hue-rotate(300deg)_brightness(1)_contrast(1)]"
                        />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
           </div>
         )}

        {/* Recommended with – same brand */}
        {recommendedProducts.length > 0 && (
          <section className="max-w-7xl mx-auto mt-16 pt-10 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 px-4">
              <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Recommended with</h2>
              {recommendedProducts.length > 0 && recommendedProducts[0]?.brand && (
                <Link
                  href={`/products?search=${encodeURIComponent(
                    typeof recommendedProducts[0].brand === "string" 
                      ? recommendedProducts[0].brand 
                      : recommendedProducts[0].brand?.name
                  )}`}
                  className="text-sm font-medium text-[#eb61a2] hover:underline"
                >
                  View All Products
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 px-4">
              {recommendedProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-[100]"
                >
                  <div className="relative h-[200px] bg-gray-100">
                    <Image
                      src={getProductImageUrl(p)}
                      alt={p?.name || "Product"}
                      fill
                      className="object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                      sizes="(max-width: 600px) 50vw, 200px"
                      unoptimized
                      onClick={() => router.push(`/product_details?productId=${p.id}`)}
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); addToFavorite(p.id); }}
                      className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-[#e53e3e] hover:bg-red-50 transition-colors"
                    >
                      <FaHeart className="text-sm" />
                    </button>
                  </div>
                  <div className="flex flex-col flex-1 p-4 gap-1 min-w-0 text-center">
                    <h3 className="text-[1.15rem] font-bold text-gray-800 truncate" title={p.name}>
                      {p.name}
                    </h3>
                    <p className="text-sm font-bold text-black mt-1">
                      {formatPrice(p.price)}
                    </p>
                    <button
                      type="button"
                      onClick={() => addToCart(p.id, 1)}
                      className="mt-3 w-full bg-[#d13e82] text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#c32c70] transition-colors"
                    >
                      <FaCartPlus className="text-base" /> Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
           </section>
         )}
        </div>
      </main>

      <Footer />
      <MessageWidget />

      <style jsx>{`
        @keyframes fadeInOut {
          0%,
          80% {
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
