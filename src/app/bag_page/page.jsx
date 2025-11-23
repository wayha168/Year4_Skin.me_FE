"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import axios from "../../api/axiosConfig";
import MessageWidget from "../../Components/MessageWidget/MessageWidget";

const ThirdImage = "/assets/third_image.png";

function BagPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await axios.get("/carts/my-cart", { withCredentials: true });
        const itemsArray = Array.isArray(res.data.data.items)
          ? res.data.data.items
          : Array.from(res.data.data.items || []);
        setCartItems(itemsArray);
      } catch (err) {
        console.error("Error fetching cart:", err);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const handleRemoveItem = async (itemId) => {
    try {
      await axios.delete(`/cartItems/item/${itemId}/delete`, { withCredentials: true });
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      setNotification("Item removed from bag");
      setTimeout(() => setNotification(""), 2000);
    } catch (err) {
      console.error("Error removing item from cart:", err);
      setNotification("Failed to remove item");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const getProductImage = (item) => {
    const imageUrl = item?.product?.images?.[0]?.downloadUrl;
    return imageUrl ? `https://backend.skinme.store${imageUrl}` : ThirdImage;
  };

  return (
    <>
      <Navbar />

      {notification && (
        <div className="fixed top-[7.5rem] right-[30px] bg-[#ff0011] text-white font-semibold px-5 py-2.5 rounded-[10px] z-[9999] shadow-[0_4px_10px_rgba(0,0,0,0.2)] animate-[fadeInOut_3s_ease]">
          {notification}
        </div>
      )}

      <main className="pt-24 px-6 pb-16 bg-white font-[Poppins,sans-serif]">
        <div className="max-w-7xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-[#eb61a2]">My Bag</h1>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 text-lg mt-20">Loading your cart...</p>
        ) : cartItems.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-20">Your bag is empty.</p>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="product-card bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
              >
                {/* Image Container */}
                <div className="product-img-container relative overflow-hidden">
                  <Image
                    onClick={() => router.push(`/product_details?productId=${item.product.id}`)}
                    src={getProductImage(item)}
                    alt={item.product.name}
                    width={400}
                    height={400}
                    className="product-img w-full h-64 object-cover rounded-t-xl cursor-pointer transition-transform duration-300 hover:scale-105"
                  />
                </div>

                {/* Info */}
                <div className="product-info flex flex-col justify-between p-5 flex-grow">
                  <div>
                    <h3 className="product-name text-lg font-semibold text-gray-800 line-clamp-2">
                      {item.product.name}
                    </h3>
                    <p className="product-price text-xl font-bold text-[#2563eb] mt-2">
                      ${item.product.price?.toFixed(2)}
                    </p>
                    <p className="text-gray-600 mt-1">Quantity: {item.quantity}</p>
                  </div>

                  <div className="flex flex-col gap-3 mt-5">
                    <button
                      onClick={() => router.push("/check_out")}
                      className="add-to-cart w-full bg-[#d13e82] text-white font-semibold py-3 px-4 rounded-xl shadow-[0_4px_12px_rgba(209,62,130,0.3)] transition-all duration-300 hover:bg-[#c32c70] hover:shadow-[0_6px_15px_rgba(209,62,130,0.4)] hover:-translate-y-1"
                    >
                      Check Out
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-[#d13e82] font-medium hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
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