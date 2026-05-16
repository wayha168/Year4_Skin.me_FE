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
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="grid grid-cols-1 gap-4 w-[70%]">
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
                          className="bg-white rounded-xl border border-[#eee] shadow-sm overflow-hidden flex flex-col max-w-[520px]"
                        >
                          <div className="flex gap-4 p-4 max-w-[500px]">
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

                <div className="lg:w-80">
                  <div className="mt-6 lg:mt-0 bg-white rounded-2xl border border-[#eee] shadow-sm p-5 sm:p-6">
                    <p className="text-center text-2xl font-bold text-[#1a1a1a] mb-4">Total</p>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[#6b7280] text-sm">Subtotal</p>
                      <p className="text-xl font-bold text-[#eb61a2]">{formatPrice(total.toFixed(2))}</p>
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
