// Checkout page: supports single-product (productId in URL) or full cart
"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import DiliveryAndPayment from "../../../Components/DiliveryAndPayment/DiliveryAndPayment";
import axiosAuth from "../../../app/lib/api/axiosConfig";
import { getProductImageUrl } from "../../../app/lib/productImage";
import { formatPrice } from "../../../app/lib/formatPrice";
import ProductPrice from "../../../Components/ProductPrice/ProductPrice";
const DefaultProductImage = "/assets/third_image.png";

/** Read-only quantity display on checkout (quantity is edited on my-bag page). */
function QuantityReadOnly({ value }) {
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#f5f5f7] text-sm font-semibold text-[#1a1a1a] tabular-nums">
      Qty: {value}
    </span>
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
  const [discountedPrices, setDiscountedPrices] = useState({});

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

  useEffect(() => {
    if (productId) setSingleQty(Math.max(1, parseInt(quantityParam, 10) || 1));
  }, [quantityParam, productId]);

  // Fetch discounted prices for checkout items
  useEffect(() => {
    const ids = [];
    if (product?.id) ids.push(product.id);
    cartItems.forEach((item) => {
      const pid = item?.product?.id ?? item?.productId;
      if (pid) ids.push(pid);
    });
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) {
      setDiscountedPrices({});
      return;
    }

    const fetchDiscounts = async () => {
      const promises = uniqueIds.map(async (pid) => {
        try {
          const res = await axiosAuth.get(`/promotions/product/${pid}/discounted-price`);
          const data = res.data?.data;
          let final = null;
          if (typeof data === "number") final = data;
          else if (data && typeof data === "object") {
            final = data.discountedPrice ?? data.price ?? data.finalPrice ?? data.discounted_price ?? data.value ?? null;
          }
          return [pid, final != null ? Number(final) : null];
        } catch {
          return [pid, null];
        }
      });
      const results = await Promise.all(promises);
      const map = {};
      results.forEach(([id, val]) => {
        if (val != null) map[id] = val;
      });
      setDiscountedPrices(map);
    };
    fetchDiscounts();
  }, [product, cartItems]);

  // Show success toast when redirected from Stripe
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Payment Successfully", {
        duration: 4000,
        position: "top-center",
      });
      // Clean the URL
      router.replace("/check_out", { scroll: false });
    }
  }, [searchParams, router]);

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
      
      <div className="min-h-screen bg-[#F7F7F7] pt-[6.5rem] pb-20 px-4 sm:px-6">
        <div className="w-full  -mt-[6.5rem]">
          <h1 className="mt-[12px] w-full h-[9rem] flex items-end justify-center max-[750px]:justify-end text-4xl font-bold  bg-[#F7F7F7] text-[#EB61A2] pb-[20px] max-[750px]:pr-4 max-[750px]:text-[1.8rem]">
            Checkout
          </h1>
        </div>
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
                           <ProductPrice
                             price={product.price}
                             discountedPrice={discountedPrices[product.id]}
                             className="mt-1 text-[#eb61a2] font-semibold text-sm sm:text-base"
                             priceClassName="font-semibold text-sm sm:text-base text-[#eb61a2]"
                           />

                        </div>
                        <div className="flex items-center justify-between gap-3 mt-2">
                          <QuantityReadOnly value={singleQty} />
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
                               <ProductPrice
                                 price={price}
                                 discountedPrice={discountedPrices[item?.product?.id ?? item?.productId]}
                                 className="mt-1 text-[#eb61a2] font-semibold text-sm sm:text-base"
                                 priceClassName="font-semibold text-sm sm:text-base text-[#eb61a2]"
                               />

                            </div>
                            <div className="flex items-center justify-between gap-3 mt-2">
                              <QuantityReadOnly value={qty} />
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
                    onClick={() => router.push("/products")}
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
