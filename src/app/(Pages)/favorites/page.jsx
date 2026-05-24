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
import ProductPrice from "../../../Components/ProductPrice/ProductPrice";

const ThirdImage = "/assets/third_image.png";

const FavoritePage = () => {
  const [favorites, setFavorites] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const [discountedPrices, setDiscountedPrices] = useState({});
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [discountPercentages, setDiscountPercentages] = useState({});
  const [promoModal, setPromoModal] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const { user, loading: authLoading } = useAuthContext();
  const { addToCart, addToFavorite, removeFavorite } = useUserActions();
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

  // Fetch discounted prices + percentages for badges (exact same as bag page)
  useEffect(() => {
    const allProds = [
      ...favorites.map((f) => f.product).filter(Boolean),
      ...recommendedProducts,
    ];
    const productIds = [...new Set(allProds.map((p) => p.id).filter(Boolean))];
    if (!productIds.length) {
      setDiscountedPrices({});
      setDiscountPercentages({});
      return;
    }

    const fetchDiscounts = async () => {
      const promises = productIds.map(async (pid) => {
        let discounted = null;
        let pct = null;
        try {
          const [priceRes, promoRes] = await Promise.all([
            axiosAuth.get(`/promotions/product/${pid}/discounted-price`).catch(() => ({ data: null })),
            axiosAuth.get(`/promotions/product/${pid}`).catch(() => ({ data: null }))
          ]);

          const data = priceRes?.data?.data;
          if (typeof data === "number") discounted = data;
          else if (data && typeof data === "object") {
            discounted = data.discountedPrice ?? data.price ?? data.finalPrice ?? data.discounted_price ?? data.value ?? null;
          }

          const promo = promoRes?.data?.data;
          if (promo && typeof promo === "object") {
            const raw = promo.discountPercentage ?? promo.discount_percentage ?? promo.discountPercent ?? promo.discount_percent ?? null;
            if (typeof raw === "number" && raw > 0) pct = Math.round(raw);
          }
        } catch {}
        return [pid, { discountedPrice: discounted != null ? Number(discounted) : null, discountPercentage: pct }];
      });

      const results = await Promise.all(promises);
      const priceMap = {};
      const pctMap = {};
      results.forEach(([id, info]) => {
        if (info.discountedPrice != null) priceMap[id] = info.discountedPrice;
        if (info.discountPercentage != null) pctMap[id] = info.discountPercentage;
      });
      setDiscountedPrices(priceMap);
      setDiscountPercentages(pctMap);
    };
    fetchDiscounts();
  }, [favorites, recommendedProducts]);

  // Favorites tracking for recommended hearts (same as home/products/details)
  useEffect(() => {
    const fetchUserFavorites = async () => {
      if (!userId) {
        setFavoriteIds(new Set());
        return;
      }
      try {
        const res = await axiosAuth.get(`/favorites/user/${userId}`, { withCredentials: true });
        const favs = res.data?.data || [];
        const ids = new Set(favs.map(f => f.product?.id ?? f.productId).filter(Boolean).map(Number));
        setFavoriteIds(ids);
      } catch {
        setFavoriteIds(new Set());
      }
    };
    fetchUserFavorites();
  }, [userId]);

  const handleToggleFavorite = useCallback(async (productId) => {
    if (!userId) {
      router.push(`/login?redirect=${encodeURIComponent("/favorites")}`);
      return;
    }

    const pid = Number(productId);
    const isFavorited = favoriteIds.has(pid);

    try {
      if (isFavorited) {
        await removeFavorite(pid);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(pid);
          return next;
        });
      } else {
        await addToFavorite(pid);
        setFavoriteIds((prev) => new Set(prev).add(pid));
      }
    } catch {}
  }, [userId, router, addToFavorite, removeFavorite, favoriteIds]);

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

  // Open promotion modal (exact same as bag/products)
  const openPromotionModal = useCallback(async (product) => {
    setPromoLoading(true);
    try {
      const res = await axiosAuth.get(`/promotions/product/${product.id}`);
      const promotion = res?.data?.data || null;
      setPromoModal({ product, promotion });
    } catch {
      setPromoModal({ product, promotion: null });
    } finally {
      setPromoLoading(false);
    }
  }, []);

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
          <h1 className="mt-[12px] w-full h-[9rem] flex items-end justify-center text-4xl font-bold bg-[#F7F7F7] text-[#EB61A2] pb-[13px] max-[750px]:text-[1.8rem]">
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
                       {/* Discount % badge - exact same as bag/products */}
                       {discountPercentages[product?.id] != null && (
                         <button
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             openPromotionModal(product);
                           }}
                           className="absolute top-2 left-2 bg-[#eb61a2] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow hover:bg-[#c8538a] active:scale-95 transition-all flex items-center gap-1 z-10"
                           title="View promotion details"
                         >
                           {discountPercentages[product.id]}%
                         </button>
                       )}
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(product.id)}
                          className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 hover:bg-red-50 transition-colors"
                       >
                         <FaHeart className="text-sm text-[#F83E94]" />
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
                          <ProductPrice
                            price={product.price}
                            discountedPrice={discountedPrices[product.id]}
                            className="mt-1"
                            centered
                          />

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
                     {/* Discount % badge - exact same as bag/products */}
                     {discountPercentages[p?.id] != null && (
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation();
                           openPromotionModal(p);
                         }}
                         className="absolute top-2 left-2 bg-[#eb61a2] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow hover:bg-[#c8538a] active:scale-95 transition-all flex items-center gap-1 z-10"
                         title="View promotion details"
                       >
                         {discountPercentages[p.id]}%
                       </button>
                     )}
                       <button
                         type="button"
                         onClick={(e) => { e.stopPropagation(); handleToggleFavorite(p.id); }}
                         className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 hover:bg-red-50 transition-colors"
                      >
                        <FaHeart 
                          className={`text-sm ${favoriteIds.has(p.id) ? 'text-[#F83E94]' : 'text-[#2F2F2F]'}`} 
                        />
                      </button>
                  </div>
                  <div className="flex flex-col flex-1 p-4 gap-1 min-w-0 text-center">
                    <h3 className="text-[1.15rem] font-bold text-gray-800 truncate" title={p.name}>
                      {p.name}
                    </h3>
                          <ProductPrice
                            price={p.price}
                            discountedPrice={discountedPrices[p.id]}
                            className="mt-1"
                            centered
                          />
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

       {/* PROMOTION MODAL - exact same as bag/products */}
       {promoModal && (
         <div
           className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
           onClick={() => setPromoModal(null)}
         >
           <div
             className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="bg-[#eb61a2] text-white px-6 py-4 flex items-center justify-between">
               <div className="font-bold text-lg">Special Promotion</div>
               <button
                 onClick={() => setPromoModal(null)}
                 className="text-white/90 hover:text-white text-2xl leading-none"
               >
                 ×
               </button>
             </div>

             <div className="p-6">
               {promoLoading ? (
                 <div className="flex justify-center py-8">
                   <div className="w-8 h-8 border-4 border-[#eb61a2] border-t-transparent rounded-full animate-spin" />
                 </div>
               ) : promoModal.promotion ? (
                 <>
                   <div className="flex gap-4 items-start">
                     <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100">
                       <Image
                         src={getProductImageUrl(promoModal.product)}
                         alt={promoModal.product?.name}
                         width={80}
                         height={80}
                         className="object-cover w-full h-full"
                         unoptimized
                       />
                     </div>
                     <div className="min-w-0">
                       <div className="font-bold text-xl text-gray-900 leading-tight">
                         {promoModal.product?.name}
                       </div>
                       <div className="text-[#eb61a2] font-extrabold text-4xl mt-1">
                         {typeof promoModal.promotion?.discountPercentage === 'number'
                           ? promoModal.promotion.discountPercentage
                           : '?'}% OFF
                       </div>
                     </div>
                   </div>

                   {promoModal.promotion.description && (
                     <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                       {promoModal.promotion.description}
                     </p>
                   )}

                   <div className="mt-4 text-xs text-gray-500">
                     {promoModal.promotion.startDate || promoModal.promotion.start_date ? (
                       <>Valid from <span className="font-medium text-gray-700">{new Date(promoModal.promotion.startDate || promoModal.promotion.start_date).toLocaleDateString()}</span></>
                     ) : null}
                     {(promoModal.promotion.endDate || promoModal.promotion.end_date) && (
                       <> until <span className="font-medium text-gray-700">{new Date(promoModal.promotion.endDate || promoModal.promotion.end_date).toLocaleDateString()}</span></>
                     )}
                   </div>
                 </>
               ) : (
                 <div className="text-center py-6">
                   <p className="text-lg font-semibold text-[#eb61a2]">Limited-time offer</p>
                   <p className="text-sm text-gray-500 mt-1">Special discount is currently active on this product.</p>
                 </div>
               )}
             </div>

             <div className="border-t p-4 flex gap-3">
               <button
                 onClick={() => setPromoModal(null)}
                 className="flex-1 py-3 rounded-2xl border text-gray-700 hover:bg-gray-50 font-medium"
               >
                 Close
               </button>
               <button
                 onClick={() => {
                   const pid = promoModal.product?.id;
                   setPromoModal(null);
                   router.push(`/product_details?productId=${pid}`);
                 }}
                 className="flex-1 py-3 rounded-2xl bg-[#eb61a2] text-white font-semibold hover:bg-[#c8538a] active:scale-[0.985] transition"
               >
                 View Product
               </button>
             </div>
           </div>
         </div>
       )}

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
