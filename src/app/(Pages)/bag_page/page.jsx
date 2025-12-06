// OPTIMIZED BAG PAGE - Fast Render
// ============================================
"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";
import axiosAuth from "../../../lib/api/axiosConfig";
import useAuthContext from "../../../lib/Authentication/AuthContext";
import { FaShoppingBag } from "react-icons/fa";

const ThirdImage = "/assets/third_image.png";

function BagPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/bag_page&message=" + encodeURIComponent("Please login to view your bag"));
    }
  }, [user, authLoading, router]);

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
          router.replace("/login?redirect=/bag_page&message=" + encodeURIComponent("Session expired. Please login again"));
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

  const handleRemoveItem = useCallback(async (item) => {
    const itemId = item.id || item.cartItemId || item.itemId;
    
    if (!itemId) {
      setNotification("Error: Could not identify item to remove");
      setTimeout(() => setNotification(""), 3000);
      return;
    }

    try {
      let success = false;
      const endpoints = [
        `/cartItems/item/${itemId}/delete`,
        `/cartItems/${itemId}`,
        `/cart/items/${itemId}`
      ];

      for (const endpoint of endpoints) {
        try {
          await axiosAuth.delete(endpoint, { withCredentials: true });
          success = true;
          break;
        } catch (err) {
          continue;
        }
      }

      if (success) {
        setCartItems((prevItems) => {
          return prevItems.filter((cartItem) => {
            const currentItemId = cartItem.id || cartItem.cartItemId || cartItem.itemId;
            return currentItemId !== itemId;
          });
        });
        
        setNotification("Item removed from bag");
        setTimeout(() => setNotification(""), 2000);
      } else {
        throw new Error("All delete attempts failed");
      }
    } catch (err) {
      console.error("Error removing item from cart:", err);
      setNotification("Failed to remove item");
      setTimeout(() => setNotification(""), 3000);
    }
  }, []);

  const handleCheckout = useCallback(() => {
    router.push("/check_out");
  }, [router]);

  const handleProductClick = useCallback((productId) => {
    router.push(`/product_details?productId=${productId}`);
  }, [router]);

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

      <main className="pt-[9rem] px-4 sm:px-6 pb-16 bg-white font-[Poppins,sans-serif]">
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 z-[1]">
              {cartItems.map((item, index) => {
                const uniqueKey = item.id || `${item.product?.id}-${index}`;
                const imageUrl = item?.product?.images?.[0]?.downloadUrl;
                const imgSrc = imageUrl ? `https://backend.skinme.store${imageUrl}` : ThirdImage;
                
                return (
                  <div
                    key={uniqueKey}
                    className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-4 flex flex-col justify-between transition-[transform_0.3s_ease,box-shadow_0.3s_ease] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-[100]"
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

                    <div className="flex flex-col justify-between px-3 py-2.5 flex-grow z-[100]">
                      <div>
                        <h3 className="text-base font-semibold text-left text-[#2d3748] leading-tight overflow-hidden text-ellipsis whitespace-nowrap max-[600px]:text-base">
                          {item.product.name}
                        </h3>
                        <p className="flex justify-center text-base font-bold text-left text-[#2563eb] my-1.5 max-[600px]:text-sm">
                          ${item.product.price?.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 text-center">
                          Quantity: {item.quantity}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleCheckout}
                          className="mt-auto bg-[#d13e82] border-none rounded-xl px-5 py-2.5 text-white font-semibold cursor-pointer flex items-center justify-center gap-2 text-[0.95rem] shadow-[0_4px_12px_rgba(209,62,130,0.3)] transition-all duration-300 hover:bg-[#c32c70] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_6px_15px_rgba(209,62,130,0.4)] active:-translate-y-px active:scale-[0.98] active:shadow-[0_4px_10px_rgba(209,62,130,0.3)] z-[100]"
                        >
                          <FaShoppingBag className="text-[1.1rem] transition-transform duration-300" />
                          Check Out
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item)}
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
}

export default BagPage;