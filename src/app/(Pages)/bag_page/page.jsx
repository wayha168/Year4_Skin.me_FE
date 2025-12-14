// OPTIMIZED BAG PAGE - Fast Render
// ============================================
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";
import axiosAuth from "../../../app/lib/api/axiosConfig";
import useAuthContext from "../../../app/lib/Authentication/AuthContext";
import { FaShoppingBag } from "react-icons/fa";

const ThirdImage = "/assets/third_image.png";

function BagPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const userId = user?.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(
        "/login?redirect=/bag_page&message=" + encodeURIComponent("Please login to view your bag")
      );
    }
  }, [user, authLoading, router]);

  // Fetch cart data
  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    const fetchCart = async () => {
      try {
        const res = await axiosAuth.get("/carts/my-cart", { withCredentials: true });
        const itemsArray = Array.isArray(res.data.data.items)
          ? res.data.data.items
          : Array.from(res.data.data.items || []);

        setCartItems(itemsArray);
      } catch (err) {
        console.error("Error fetching cart:", err);

        if (err.response?.status === 404) {
          setCartItems([]);
        } else if (err.response?.status === 401) {
          router.replace(
            "/login?redirect=/bag_page&message=" + encodeURIComponent("Session expired. Please login again")
          );
        } else {
          setNotification("Failed to load cart");
          setTimeout(() => setNotification(""), 3000);
          setCartItems([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user, authLoading, router]);

  // Remove item from cart - TRYING COMMON CART DELETE ENDPOINTS
  const handleRemoveItem = useCallback(
    async (itemId) => {
      if (!userId) return;

      try {
        // Try common cart delete endpoint patterns (similar to /favorites/remove)
        const endpoints = [
          { url: "/cart/remove", params: { userId, itemId } },
          { url: "/carts/remove", params: { userId, itemId } },
          { url: "/cartItems/remove", params: { userId, itemId } },
          { url: "/cart-items/remove", params: { userId, itemId } },
        ];

        let success = false;
        for (const endpoint of endpoints) {
          try {
            await axiosAuth.delete(endpoint.url, {
              params: endpoint.params,
              withCredentials: true,
            });
            console.log(`Success with endpoint: ${endpoint.url}`);
            success = true;
            break;
          } catch (err) {
            console.log(`Failed with endpoint: ${endpoint.url}`, err.response?.status);
            continue;
          }
        }

        if (!success) {
          throw new Error("All cart delete endpoints failed");
        }

        setCartItems((prev) => prev.filter((cartItem) => {
          const currentItemId = cartItem.id || cartItem.cartItemId || cartItem.itemId;
          return currentItemId !== itemId;
        }));

        setNotification("Item removed from bag");
        setTimeout(() => setNotification(""), 2000);
      } catch (err) {
        console.error("Error removing item from cart:", err);
        setNotification("Failed to remove item");
        setTimeout(() => setNotification(""), 3000);
      }
    },
    [userId]
  );

  const handleCheckout = useCallback(() => {
    router.push("/check_out");
  }, [router]);

  const handleProductClick = useCallback(
    (productId) => {
      router.push(`/product_details?productId=${productId}`);
    },
    [router]
  );

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

      <main className="flex-col justify-start pt-[9rem] px-4 sm:px-6 pb-16 bg-white font-[Poppins,sans-serif]">
        <div className="max-w-7xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-[#eb61a2]">My Bag</h1>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 text-lg mt-20">
            <i className="fa fa-spinner fa-spin mr-2" />
            Loading your cart...
          </p>
        ) : cartItems.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-20">Your bag is empty.</p>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="flex-row z-[1]">
              {cartItems.map((item, index) => {
                const uniqueKey = item.id || `${item.product?.id}-${index}`;
                const itemId = item.id || item.cartItemId || item.itemId;
                const imageUrl = item?.product?.images?.[0]?.downloadUrl;
                const imgSrc = imageUrl ? `https://backend.skinme.store${imageUrl}` : ThirdImage;

                return (
                  <div
                    key={uniqueKey}
                    className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] py-3 px-4 flex justify-start transition-[transform_0.3s_ease,box-shadow_0.3s_ease] mb-[1rem] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-[100] w-[80%] scale-[0.9]"
                  >
                    <div className="relative">
                      <Image
                        onClick={() => handleProductClick(item.product.id)}
                        src={imgSrc}
                        alt={item.product.name}
                        width={400}
                        height={400}
                        loading="lazy"
                        className="w-full h-[200px] object-cover rounded-2xl cursor-pointer transition-transform duration-300 hover:scale-105 max-[600px]:h-[200px]"
                      />
                    </div>

                    <div className="flex flex-col items-end justify-between px-3 py-2.5 flex-grow z-[100]">
                      <div className="flex-col items-center justify-between">
                        <h3 className="flex justify-center text-base font-semibold text-[#2d3748] leading-tight overflow-hidden text-ellipsis whitespace-nowrap max-[600px]:text-base">
                          {item.product.name}
                        </h3>
                        <p className="flex justify-center text-base font-bold text-left text-[#2563eb] my-1.5 max-[600px]:text-sm">
                          ${item.product.price?.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 text-center">Quantity: {item.quantity}</p>

                        <div className="flex flex-col items-center">
                          <button
                            onClick={handleCheckout}
                            className="mt-[1rem] bg-[#d13e82] border-none rounded-xl px-5 py-2.5 text-white font-semibold cursor-pointer flex items-center justify-center gap-2 text-[0.95rem] shadow-[0_4px_12px_rgba(209,62,130,0.3)] transition-all duration-300 hover:bg-[#c32c70] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_6px_15px_rgba(209,62,130,0.4)] active:-translate-y-px active:scale-[0.98] active:shadow-[0_4px_10px_rgba(209,62,130,0.3)] z-[100] w-[13rem]"
                          >
                            <FaShoppingBag className="text-[1.1rem] transition-transform duration-300" />
                            Check Out
                          </button>
                          <button
                            onClick={() => handleRemoveItem(itemId)}
                            className="text-[#d13e82] font-medium hover:underline text-sm"
                          >
                            Remove
                          </button>
                        </div>
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
}

export default BagPage;