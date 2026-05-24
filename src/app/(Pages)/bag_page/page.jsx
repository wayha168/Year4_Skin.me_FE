"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";
import axiosAuth from "../../../app/lib/api/axiosConfig";
import useAuthContext from "../../../app/lib/Authentication/AuthContext";
import { updateCartItemQuantity, removeCartItem } from "../../../app/lib/cartUpdateQuantity";
import { FaShoppingBag, FaHeart, FaCartPlus } from "react-icons/fa";
import { getProductImageUrl } from "../../../app/lib/productImage";
import { formatPrice } from "../../../app/lib/formatPrice";
import ProductPrice from "../../../Components/ProductPrice/ProductPrice";

const DefaultProductImage = "/assets/third_image.png";

function QuantityStepper({ value, min = 1, max = 999, onChange, disabled, onRemove }) {
  const isOne = value <= min;
  const canIncrease = !max || value < max;

  return (
    <div className="inline-flex items-center border border-[#e5e7eb] rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={isOne ? onRemove : () => onChange(Math.max(min, value - 1))}
        disabled={disabled}
        className="w-8 h-8 flex items-center justify-center text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[1rem] font-bold"
        aria-label={isOne ? "Remove item" : "Decrease quantity"}
      >
        {isOne ? (
          <Image
            src="/assets/DeleteFavorite/DeleteIcon.svg"
            alt="Remove"
            width={14}
            height={14}
            className="[filter:brightness(0)_saturate(100%)_invert(13%)_sepia(98%)_saturate(7473%)_hue-rotate(0deg)_brightness(1)_contrast(1)]"
          />
        ) : (
          "−"
        )}
      </button>
      <span className="w-8 text-center text-sm font-semibold text-[#1a1a1a] tabular-nums">{value}</span>
       <button
         type="button"
         onClick={() => {
           if (canIncrease) onChange(Math.min(max, value + 1));
         }}
         disabled={disabled || !canIncrease}
         className="w-8 h-8 flex items-center justify-center text-[#374151] hover:bg-[#f9fafb] transition-colors text-sm  text-[18px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
         aria-label="Increase quantity"
       >
         +
       </button>
    </div>
  );
}

function BagPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [cartId, setCartId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const [discountedPrices, setDiscountedPrices] = useState({});
  const [discountPercentages, setDiscountPercentages] = useState({});
  const [promoModal, setPromoModal] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const res = await axiosAuth.get("/carts/my-cart", { withCredentials: true });
      const data = res.data?.data;
      const items = Array.isArray(data?.items) ? data.items : Array.from(data?.items || []);
      const cid =
        data?.id ??
        data?.cartId ??
        data?.cart?.id ??
        res.data?.cartId ??
        res.data?.id ??
        (items[0]?.cartId ?? items[0]?.cart_id ?? null);
      setCartId(cid != null ? String(cid) : null);
      setCartItems(items);

      // Fetch recommended products (random fallback if no brand match)
      if (items.length > 0) {
        const firstProduct = items[0].product;
        const cartProductIds = items.map(i => i.product?.id).filter(Boolean);

        try {
          const res = await axiosAuth.get("/products/all");
          const allProducts = res.data?.data || [];

          let recommended = allProducts.filter(p => !cartProductIds.includes(p.id));

          // Try brand match first
          const brandId = firstProduct?.brand?.id;
          const brandName = typeof firstProduct?.brand === "string" 
            ? firstProduct.brand 
            : firstProduct?.brand?.name;

          if (brandId || brandName) {
            const brandMatch = recommended.filter(p => {
              const pBrandId = p.brand?.id;
              const pBrandName = typeof p.brand === "string" ? p.brand : p.brand?.name;
              return (brandId && pBrandId === brandId) || (brandName && pBrandName === brandName);
            });
            if (brandMatch.length > 0) recommended = brandMatch;
          }

          // Shuffle and take 5
          recommended = recommended.sort(() => 0.5 - Math.random()).slice(0, 5);
          setRecommendedProducts(recommended);
        } catch (e) {
          console.error("Failed to fetch recommended products");
          setRecommendedProducts([]);
        }
      } else {
        setRecommendedProducts([]);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setCartId(null);
        setCartItems([]);
      } else if (err.response?.status === 401) {
        router.replace("/login?redirect=/bag_page&message=" + encodeURIComponent("Session expired. Please login again"));
      } else {
        setNotification("Failed to load cart");
        setTimeout(() => setNotification(""), 3000);
        setCartId(null);
        setCartItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/bag_page&message=" + encodeURIComponent("Please login to view your bag"));
      return;
    }
    setLoading(true);
    fetchCart();
  }, [user, authLoading, router, fetchCart]);

  // Fetch discounted prices + percentages for badges (identical to products page)
  useEffect(() => {
    const fetchDiscounts = async () => {
      if (!cartItems.length) {
        setDiscountedPrices({});
        setDiscountPercentages({});
        return;
      }

      const productIds = [...new Set(
        cartItems.map(i => i.product?.id).filter(Boolean)
      )];

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
  }, [cartItems]);

  const findItemByKey = useCallback((itemKey, index) => {
    const byId = cartItems.find((i) => String(i.id ?? i.cartItemId ?? i.itemId) === String(itemKey));
    if (byId) return byId;
    const match = String(itemKey).match(/^cart-(\d+)-(\d+)$/);
    if (match) {
      const pid = match[1];
      const idx = parseInt(match[2], 10);
      const byIndex = cartItems[idx];
      if (byIndex && String(byIndex.product?.id) === pid) return byIndex;
      return cartItems.find((i) => String(i.product?.id) === pid) ?? null;
    }
    return null;
  }, [cartItems]);

  const updateQty = useCallback(
    async (itemKey, newQty) => {
      const item = findItemByKey(itemKey);
      if (!item) return;
      const productMax = Math.max(1, Number(item.product?.inventory ?? item.product?.stock ?? item.product?.quantity ?? 999));
      const qty = Math.max(1, Math.min(productMax, Number(newQty)));
      const prevQty = item.quantity ?? 1;
      if (qty === prevQty) return;

      const itemId = item.id ?? item.cartItemId ?? item.itemId;
      const productId = item.product?.id;
      setCartItems((prev) =>
        prev.map((i) => {
          const id = i.id ?? i.cartItemId ?? i.itemId;
          const same = String(id) === String(itemKey) || (itemKey?.startsWith?.("cart-") && i.product?.id === productId);
          if (!same) return i;
          return { ...i, quantity: qty };
        })
      );

      const success = await updateCartItemQuantity(axiosAuth, itemId, qty, productId, cartId);
      if (!success) {
        setCartItems((prev) =>
          prev.map((i) => {
            const id = i.id ?? i.cartItemId ?? i.itemId;
            const same = String(id) === String(itemKey) || (itemKey?.startsWith?.("cart-") && i.product?.id === productId);
            if (!same) return i;
            return { ...i, quantity: prevQty };
          })
        );
        setNotification("Could not update quantity");
        setTimeout(() => setNotification(""), 3000);
      }
    },
    [cartId, cartItems, findItemByKey]
  );

  const handleRemoveItem = useCallback(
    async (itemKey) => {
      const item = findItemByKey(itemKey);
      if (!item) return;
      const itemId = item.id ?? item.cartItemId ?? item.itemId;
      const productId = item.product?.id;
      const success = await removeCartItem(axiosAuth, itemId, user?.id, productId, cartId);
      if (success) {
        setCartItems((prev) =>
          prev.filter((i) =>
            itemId != null ? (i.id ?? i.cartItemId ?? i.itemId) !== itemId : String(i.product?.id) !== String(productId)
          )
        );
        setNotification("Item removed");
        setTimeout(() => setNotification(""), 2000);
      } else {
        setNotification("Failed to remove item");
        setTimeout(() => setNotification(""), 3000);
      }
    },
    [user?.id, cartId, cartItems, findItemByKey]
  );

  const handleCheckout = useCallback(() => {
    router.push("/check_out");
  }, [router]);

  const handleProductClick = useCallback((productId) => {
    router.push(`/product_details?productId=${productId}`);
  }, [router]);

  const addToFavorite = useCallback((productId) => {
    setNotification("Added to favorites");
    setTimeout(() => setNotification(""), 2000);
  }, []);

  const addToCart = useCallback(async (productId, qty = 1) => {
    setNotification("Added to cart");
    setTimeout(() => setNotification(""), 2000);
  }, []);

  // Open promotion modal (identical to products/homepage)
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

  const total = cartItems.reduce((sum, item) => {
    const pid = item.product?.id;
    const original = item.product?.price ?? 0;
    const disc = discountedPrices[pid];
    const eff = (disc != null && disc < original) ? disc : original;
    return sum + eff * (item.quantity ?? 1);
  }, 0);
  const itemCount = cartItems.reduce((s, i) => s + (i.quantity ?? 1), 0);
  const brandName =
    cartItems.length > 0
      ? typeof cartItems[0].product?.brand === "string"
        ? cartItems[0].product.brand
        : cartItems[0].product?.brand?.name ?? ""
      : "";

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#eb61a2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar alwaysVisible />

      {notification && (
        <div className="fixed top-20 right-4 z-[9999] bg-[#1a1a1a] text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg">
          {notification}
        </div>
      )}

      <main className="pt-[5rem] px-0 pb-20 bg-[#F7F7F7] font-[Poppins,sans-serif]">
        {/* ===== Hero Section ===== */}
        <div className="w-full mb-[1rem] -mt-[4.5rem]">
          <h1 className="mt-[12px] w-full h-[9rem] flex items-end justify-center max-[750px]:justify-end text-4xl font-bold  bg-[#F7F7F7] text-[#EB61A2] pb-[13px] max-[750px]:pr-4 max-[750px]:text-[1.8rem]">
            Bags
          </h1>
        </div>

        <div className="px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <header className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight">My Items</h1>
              <p className="text-[#6b7280] text-sm mt-1">
                {cartItems.length ? `${itemCount} item${itemCount !== 1 ? "s" : ""} in your bag` : "Your bag is empty"}
              </p>
            </header>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-2 border-[#eb61a2] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : cartItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#eee] shadow-sm p-12 text-center">
              <p className="text-[#6b7280] mb-6">No items in your bag yet.</p>
              <button
                type="button"
                onClick={() => router.push("/products")}
                className="py-3 px-6 rounded-xl bg-[#eb61a2] text-white font-semibold hover:bg-[#d94d8c] transition"
              >
                Shop products
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="grid grid-cols-1 gap-4 w-[100%]">
                    {cartItems.map((item, index) => {
                      const p = item.product;
                      const qty = item.quantity ?? 1;
                      const price = p?.price ?? 0;
                      const pid = p?.id;
                      const discounted = discountedPrices[pid];
                      const effectivePrice = (discounted != null && discounted < price) ? discounted : price;
                      const key = item.id ?? item.cartItemId ?? `cart-${p?.id}-${index}`;
                      const lineTotal = (effectivePrice * qty).toFixed(2);
                      const imgSrc = getProductImageUrl(p, DefaultProductImage);

                      return (
                        <div
                          key={key}
                          className="bg-white rounded-xl border border-[#eee] shadow-sm overflow-hidden flex flex-col w-full"
                        >
                          <div className="flex gap-4 p-4 w-full">
                             <button
                               type="button"
                               onClick={() => p?.id && handleProductClick(p.id)}
                               className="shrink-0 w-[100px] h-[100px] rounded-lg overflow-hidden bg-[#f9fafb] border border-[#eee] focus:outline-none focus:ring-2 focus:ring-[#eb61a2] relative"
                             >
                                 <Image
                                   src={imgSrc}
                                   alt={p?.name ?? "Product"}
                                   width={100}
                                   height={100}
                                   className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.06] active:scale-[0.96]"
                                   unoptimized
                                 />
                              </button>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                               <h3 className="font-bold text-[#1a1a1a] truncate text-sm sm:text-base">{p?.name}</h3>
                               {discountPercentages[p?.id] != null ? (
                                 <p className="text-[#eb61a2] text-xs mt-0.5 font-semibold pb-[3px]">
                                   {discountPercentages[p.id]}% OFF
                                 </p>
                               ) : null}
                                 <ProductPrice 
                                   price={price} 
                                   discountedPrice={discountedPrices[p?.id]} 
                                 />
 
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <QuantityStepper
                                      value={qty}
                                      max={Math.max(1, Number(p?.inventory ?? p?.stock ?? p?.quantity ?? 999))}
                                      onChange={(newQty) => updateQty(key, newQty)}
                                      onRemove={() => handleRemoveItem(key)}
                                    />
                                    {(() => {
                                      const stock = Math.max(1, Number(p?.inventory ?? p?.stock ?? p?.quantity ?? 999));
                                      return stock < 999 ? (
                                        <div className="inline-flex items-center  overflow-hidden bg-white px-2.5 py-1 text-[11px] text-gray-500 font-medium">
                                          Only {stock} left
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                  <span className="text-sm font-medium opacity-60  text-[#636363]">Subtotal {formatPrice(lineTotal)}</span>
                                </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:w-96">
                  <div className="mt-6 lg:mt-0 bg-white rounded-2xl border border-[#eee] shadow-sm p-5 sm:p-6">
                    <p className="text-center text-2xl font-bold text-[#1a1a1a] mb-4">Total</p>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[#000000] font-medium text-[1.25rem]">Subtotal</p>
                      <p className="text-xl font-bold text-[#eb61a2]">{formatPrice(total.toFixed(2))}</p>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[#000000] font-medium text-[1.25rem]">Free Delivery</p>
                      <div className="relative group">
                        <Image
                          src="/assets/BagPage/theImportIcon.svg"
                          alt="Important"
                          width={28}
                          height={28}
                          className="cursor-help"
                        />
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm hidden group-hover:block z-50">
                          <p className="font-semibold mb-1">Free Delivery Benefits</p>
                          <ul className="list-disc list-inside text-[#6b7280] space-y-1">
                            <li>Free shipping on orders over $50</li>
                            <li>3-5 business days delivery</li>
                            <li>Track your package in real-time</li>
                            <li>Easy returns within 30 days</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="w-full py-3.5 px-8 rounded-xl bg-[#eb61a2] text-white font-semibold hover:bg-[#d94d8c] transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <FaShoppingBag className="text-lg" />
                      Checkout / Make payment
                    </button>
                      <p className="text-[#000000] pt-4 font-medium text-[1.25rem]">We accept</p>
                     <div className="opacity-[0.9] mt-4 flex items-center justify-start gap-3 w-[330px] bg-[#646464] py-3 pl-3 rounded-lg">
                       <Image src="/assets/CardBagPage/firstCard.svg" alt="Visa" width={45} height={26} />
                       <Image src="/assets/CardBagPage/secondCard.svg" alt="Mastercard" width={42} height={26} />
                       <Image src="/assets/CardBagPage/thirdCard.svg" alt="Amex" width={80} height={26} />
                       <Image src="/assets/CardBagPage/fourCard.svg" alt="PayPal" width={42} height={26} />
                       <Image src="/assets/CardBagPage/fiveCard.svg" alt="Apple Pay" width={50} height={26} />
                     </div>
                  </div>
                </div>
              </div>

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
                             {/* Discount % badge - identical to products page */}
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
                             <ProductPrice
                               price={p.price}
                               discountedPrice={discountedPrices[p.id]}
                               className="mt-1"
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
            </>
          )}
         </div>
        </div>
       </main>

       {/* PROMOTION MODAL - identical to products page */}
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

       {/* for pull */}

       <Footer />
      <MessageWidget />
    </>
  );
}

export default BagPage;
// for pull