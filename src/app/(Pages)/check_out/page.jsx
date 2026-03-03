// Checkout page: supports single-product (productId in URL) or full cart
"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";
import DiliveryAndPayment from "../../../Components/DiliveryAndPayment/DiliveryAndPayment";
import axiosAuth from "../../../app/lib/api/axiosConfig";
import { getProductImageUrl } from "../../../app/lib/productImage";
import { formatPrice } from "../../../app/lib/formatPrice";
import { updateCartItemQuantity } from "../../../app/lib/cartUpdateQuantity";

const DefaultProductImage = "/assets/third_image.png";

function QuantityStepper({ value, min = 1, onChange, disabled }) {
  return (
    <div className="inline-flex items-center border border-[#e5e7eb] rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className="w-9 h-9 flex items-center justify-center text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-10 text-center text-sm font-semibold text-[#1a1a1a] tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        className="w-9 h-9 flex items-center justify-center text-[#374151] hover:bg-[#f9fafb] disabled:cursor-not-allowed transition-colors"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

function CheckOutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const quantityParam = searchParams.get("quantity") || "1";

  const [mode, setMode] = useState(null); // "single" | "cart"
  const [product, setProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [singleQty, setSingleQty] = useState(Math.max(1, parseInt(quantityParam, 10) || 1));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Single product: fetch one product by ID
  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const response = await axiosAuth.get(`/products/${productId}`);
          const data = response?.data?.data ?? response?.data?.product ?? response?.data;
          setProduct(data ?? null);
          setMode("single");
          if (!data) setError("Product not found.");
        } catch (err) {
          setError(err?.response?.data?.message || err.message || "Failed to load product.");
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
      return;
    }

    // No productId: load cart
    const fetchCart = async () => {
      try {
        setLoading(true);
        const res = await axiosAuth.get("/carts/my-cart", { withCredentials: true });
        const data = res.data?.data;
        const items = Array.isArray(data?.items) ? data.items : Array.from(data?.items || []);
        setCartItems(items);
        setMode("cart");
      } catch (err) {
        if (err.response?.status === 404) {
          setCartItems([]);
          setMode("cart");
        } else if (err.response?.status === 401) {
          router.replace("/login?redirect=/check_out&message=" + encodeURIComponent("Please login to checkout"));
          return;
        } else {
          setError("Failed to load cart.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [productId, router]);

  const refetchCart = useCallback(async () => {
    try {
      const res = await axiosAuth.get("/carts/my-cart", { withCredentials: true });
      const data = res.data?.data;
      const items = Array.isArray(data?.items) ? data.items : Array.from(data?.items || []);
      setCartItems(items);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (productId) setSingleQty(Math.max(1, parseInt(quantityParam, 10) || 1));
  }, [quantityParam, productId]);

  const updateCartItemQty = useCallback(
    async (itemKey, newQty) => {
      const item = cartItems.find((i) => String(i.id ?? i.cartItemId ?? i.itemId) === String(itemKey));
      if (!item) return;
      const qty = Math.max(1, Number(newQty));
      const prevQty = item.quantity ?? 1;
      if (qty === prevQty) return;

      const itemId = item.id ?? item.cartItemId ?? item.itemId;
      setCartItems((prev) =>
        prev.map((i) => {
          const id = i.id ?? i.cartItemId ?? i.itemId;
          if (String(id) !== String(itemKey)) return i;
          return { ...i, quantity: qty };
        })
      );

      const success = await updateCartItemQuantity(axiosAuth, itemId, qty);
      if (success) {
        await refetchCart();
      } else {
        setCartItems((prev) =>
          prev.map((i) => {
            const id = i.id ?? i.cartItemId ?? i.itemId;
            if (String(id) !== String(itemKey)) return i;
            return { ...i, quantity: prevQty };
          })
        );
      }
    },
    [cartItems, refetchCart]
  );

  let totalPrice = "0.00";
  let itemCount = 0;
  if (mode === "single" && product) {
    totalPrice = (product.price * singleQty).toFixed(2);
    itemCount = singleQty;
  } else if (mode === "cart" && cartItems.length > 0) {
    const total = cartItems.reduce((sum, item) => {
      const qty = item.quantity ?? 1;
      const price = item.product?.price ?? 0;
      return sum + price * qty;
    }, 0);
    totalPrice = total.toFixed(2);
    itemCount = cartItems.reduce((s, i) => s + (i.quantity ?? 1), 0);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#eb61a2] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#555] text-sm">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] pt-20 px-5">
        <p className="text-[#555] text-center text-lg mb-6">{error}</p>
        <button
          className="bg-[#eb61a2] text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition"
          onClick={() => router.push("/products")}
        >
          Back to Products
        </button>
      </div>
    );
  }

  const emptyCart = mode === "cart" && cartItems.length === 0;
  const noItems = mode === "single" && !product;
  if (emptyCart || noItems) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] pt-20 px-5">
        <p className="text-[#555] text-center text-lg mb-6">
          {emptyCart ? "Your bag is empty." : "No product selected for checkout."}
        </p>
        <div className="flex gap-3">
          <button
            className="bg-[#f0f0f0] text-[#333] py-3 px-5 rounded-xl font-medium hover:bg-[#e5e5e5] transition"
            onClick={() => router.push("/products")}
          >
            Shop Products
          </button>
          <button
            className="bg-[#eb61a2] text-white py-3 px-5 rounded-xl font-medium hover:opacity-90 transition"
            onClick={() => router.push("/bag_page")}
          >
            My Bag
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#f5f5f7] pt-[6.5rem] pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] tracking-tight">Checkout</h1>
            <p className="text-[#6b7280] text-sm mt-1">Review your order and complete delivery & payment</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Left: Order summary + total */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <section className="bg-white rounded-2xl shadow-sm border border-[#eee] overflow-hidden sticky top-24">
                <div className="px-5 sm:px-6 py-4 border-b border-[#f0f0f0]">
                  <h2 className="text-base font-semibold text-[#1a1a1a]">Order summary</h2>
                  <p className="text-[#6b7280] text-sm mt-0.5">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
                </div>
                <ul className="divide-y divide-[#f0f0f0] max-h-[320px] overflow-y-auto">
                  {mode === "single" && product && (
                    <li className="flex gap-4 p-5 sm:p-6">
                      <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#f9fafb] border border-[#eee]">
                        <img
                          src={getProductImageUrl(product, DefaultProductImage)}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-medium text-[#1a1a1a] truncate">{product.name}</h3>
                          <p className="text-[#9ca3af] text-xs sm:text-sm mt-0.5">{product.brand?.name || "—"}</p>
                          <p className="text-[#eb61a2] font-semibold text-sm sm:text-base mt-1">{formatPrice(product.price)}</p>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-2">
                          <QuantityStepper value={singleQty} onChange={setSingleQty} />
                          <span className="text-sm font-medium text-[#374151]">
                            {formatPrice((product.price * singleQty).toFixed(2))}
                          </span>
                        </div>
                      </div>
                    </li>
                  )}
                  {mode === "cart" &&
                    cartItems.map((item, index) => {
                      const p = item.product;
                      const qty = item.quantity ?? 1;
                      const price = p?.price ?? 0;
                      const key = item.id ?? item.cartItemId ?? `cart-${p?.id}-${index}`;
                      const lineTotal = (price * qty).toFixed(2);
                      return (
                        <li key={key} className="flex gap-4 p-5 sm:p-6">
                          <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#f9fafb] border border-[#eee]">
                            <img
                              src={getProductImageUrl(p, DefaultProductImage)}
                              alt={p?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h3 className="font-medium text-[#1a1a1a] truncate">{p?.name}</h3>
                              <p className="text-[#9ca3af] text-xs sm:text-sm mt-0.5">{p?.brand?.name || "—"}</p>
                              <p className="text-[#eb61a2] font-semibold text-sm sm:text-base mt-1">{formatPrice(price)}</p>
                            </div>
                            <div className="flex items-center justify-between gap-3 mt-2">
                              <QuantityStepper
                                value={qty}
                                onChange={(newQty) => updateCartItemQty(key, newQty)}
                              />
                              <span className="text-sm font-medium text-[#374151]">{formatPrice(lineTotal)}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                </ul>
                <div className="px-5 sm:px-6 py-4 bg-[#fafafa] border-t border-[#eee] flex justify-between items-center">
                  <span className="font-semibold text-[#1a1a1a]">Total</span>
                  <span className="text-xl font-bold text-[#eb61a2]">{formatPrice(totalPrice)}</span>
                </div>
                <div className="px-5 sm:px-6 pb-4">
                  <button
                    type="button"
                    className="w-full py-3 rounded-xl border border-[#e5e7eb] bg-white text-[#374151] font-medium hover:bg-[#f9fafb] transition-colors"
                    onClick={() => router.back()}
                  >
                    ← Continue shopping
                  </button>
                </div>
              </section>
            </div>

            {/* Right: Delivery & payment form */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-sm border border-[#eee] overflow-hidden">
                <DiliveryAndPayment totalPrice={totalPrice} onClose={() => {}} embedded />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <MessageWidget />
    </>
  );
}

function CheckOutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] pt-20">
        <div className="w-10 h-10 border-2 border-[#eb61a2] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckOutContent />
    </Suspense>
  );
}

export default CheckOutPage;
