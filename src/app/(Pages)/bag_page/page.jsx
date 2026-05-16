"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";
import axiosAuth from "../../../app/lib/api/axiosConfig";
import useAuthContext from "../../../app/lib/Authentication/AuthContext";
import { updateCartItemQuantity, removeCartItem } from "../../../app/lib/cartUpdateQuantity";
import { FaShoppingBag } from "react-icons/fa";
import { getProductImageUrl } from "../../../app/lib/productImage";
import { formatPrice } from "../../../app/lib/formatPrice";

const DefaultProductImage = "/assets/third_image.png";

function QuantityStepper({ value, min = 1, onChange, disabled, onRemove }) {
  const isOne = value <= min;

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
            className="[filter:brightness(0)_saturate(100%)_invert(13%)_sepia(98%)_saturate(7473%)_hue-rotate(0deg)_brightness(1)_contrast(1)] "
          />
        ) : (
          "−"
        )}
      </button>
      <span className="w-8 text-center text-sm font-semibold text-[#1a1a1a] tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        className="w-8 h-8 flex items-center justify-center text-[#374151] hover:bg-[#f9fafb] transition-colors text-sm  text-[18px] font-bold"
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

      // Fetch recommended products
      if (items.length > 0) {
        const firstProduct = items[0].product;
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
      const qty = Math.max(1, Number(newQty));
      const item = findItemByKey(itemKey);
      if (!item) return;
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

  const total = cartItems.reduce((sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 1), 0);
  const itemCount = cartItems.reduce((s, i) => s + (i.quantity ?? 1), 0);

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

      <main className="min-h-screen bg-[#CCF6F2] pt-[6.5rem] pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight">My Bag</h1>
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
                      const key = item.id ?? item.cartItemId ?? `cart-${p?.id}-${index}`;
                      const lineTotal = (price * qty).toFixed(2);
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
                              className="shrink-0 w-[100px] h-[100px] rounded-lg overflow-hidden bg-[#f9fafb] border border-[#eee] focus:outline-none focus:ring-2 focus:ring-[#eb61a2]"
                            >
                              <Image
                                src={imgSrc}
                                alt={p?.name ?? "Product"}
                                width={100}
                                height={100}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </button>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h3 className="font-bold text-[#1a1a1a] truncate text-sm sm:text-base">{p?.name}</h3>
                              <p className="text-[#9ca3af] text-xs mt-0.5">
                            {p?.brand ? (typeof p.brand === "string" ? p.brand : p.brand.name) : "—"}
                          </p>
                              <p className="text-[#eb61a2] font-semibold text-sm mt-1">Price {formatPrice(price)}</p>

                              <div className="mt-2 flex items-center justify-between gap-2">
                                 <QuantityStepper
                                   value={qty}
                                   onChange={(newQty) => updateQty(key, newQty)}
                                   onRemove={() => handleRemoveItem(key)}
                                 />
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
                  </div>
                </div>
               </div>

              {/* Recommended Products */}
              {recommendedProducts.length > 0 && (
                <div className="mt-16 pt-10 border-t border-gray-200 max-w-5xl mx-auto">
                  <h2 className="text-xl font-semibold text-gray-900 tracking-tight mb-8 px-4">Recommended with</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 px-4">
                    {recommendedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                      >
                        <div className="relative h-[200px] bg-gray-100">
                          <Image
                            src={getProductImageUrl(p)}
                            alt={p.name}
                            fill
                            className="object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                            onClick={() => router.push(`/product_details?productId=${p.id}`)}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToFavorite(p.id);
                            }}
                            className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-[#e53e3e] hover:bg-red-50 transition-colors"
                          >
                            <FaHeart className="text-sm" />
                          </button>
                        </div>
                        <div className="flex flex-col flex-1 p-4 gap-1 min-w-0 text-center">
                          <h3 className="text-[1.15rem] font-bold text-gray-800 truncate">{p.name}</h3>
                          <p className="text-sm font-bold text-black mt-1">{formatPrice(p.price)}</p>
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
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
      <MessageWidget />
    </>
  );
}

export default BagPage;
