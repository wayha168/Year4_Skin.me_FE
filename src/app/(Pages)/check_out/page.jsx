// src/Pages/CheckOutPage/CheckOutPage.jsx
"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";
import DiliveryAndPayment from "../../../Components/DiliveryAndPayment/DiliveryAndPayment";

function CheckOutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const quantity = searchParams.get("quantity") || 1;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          // Assuming an API endpoint exists to fetch a product by its ID
          const response = await fetch(`https://backend.skinme.store/api/products/${productId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch product data.");
          }
          const data = await response.json();
          setProduct(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    } else {
      setLoading(false);
    }
  }, [productId]);

  if (loading) {
    return <div className="text-center mt-[100px] text-[1.2rem] text-[#555]">Loading...</div>;
  }
  
  if (error || !product) {
    return (
      <div className="text-center mt-[100px]">
        <p className="text-[1.2rem] text-[#555]">{error || "No product selected for checkout."}</p>
        <button 
          className="mt-5 bg-[#eb61a2] text-white py-[10px] px-[18px] rounded-lg border-none cursor-pointer transition-all duration-300" 
          onClick={() => router.push("/products")}
        >
          Go Back to Products
        </button>
      </div>
    );
  }

  const totalPrice = (product.price * quantity).toFixed(2);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  return (
    <>
      <Navbar />

      <div className="bg-[#fafafa] min-h-[70vh] flex flex-col items-center pt-[140px] px-5 pb-[60px]">
        <div className="bg-white rounded-2xl py-10 px-[30px] w-full max-w-[800px] shadow-[0_4px_15px_rgba(0,0,0,0.08)] max-[768px]:py-[30px] max-[768px]:px-5">
          <h2 className="text-center text-[#eb61a2] text-[2rem] mb-[30px] font-semibold">Your Bag</h2>

          <div className="flex flex-col gap-[30px]">
            <div className="flex items-center gap-[25px] border-b border-[#eee] pb-5 max-[768px]:flex-col max-[768px]:text-center">
              <img
                src={`https://backend.skinme.store${product.images?.[0]?.downloadUrl}`}
                alt={product.name}
                className="w-40 h-40 rounded-xl object-cover shadow-[0_2px_8px_rgba(0,0,0,0.1)] max-[768px]:w-[200px] max-[768px]:h-[200px]"
              />

              <div>
                <h3 className="text-[1.4rem] mb-2 text-[#333]">{product.name}</h3>
                <p className="text-[#777] text-[0.95rem] mb-[5px]">Brand: {product.brand?.name || "Unknown"}</p>
                <p className="text-[#eb61a2] font-bold text-[1.2rem]">${product.price}</p>
                <p>Quantity: {quantity}</p>
                <p className="mt-[10px] font-bold text-[#222]">Total: ${totalPrice}</p>
              </div>
            </div>

            <div className="flex justify-between items-center gap-[15px] mt-[10px] max-[768px]:flex-col">
              <button 
                className="py-3 px-5 rounded-[10px] border-none text-base cursor-pointer transition-all duration-300 bg-[#f0f0f0] text-[#333] hover:bg-[#e0e0e0]" 
                onClick={() => router.back()}
              >
                ← Continue Shopping
              </button>
              <button 
                className="py-3 px-5 rounded-[10px] border-none text-base cursor-pointer transition-all duration-300 bg-[linear-gradient(90deg,#eb61a2,#ff7bbd)] text-white font-semibold hover:bg-[linear-gradient(90deg,#ff7bbd,#eb61a2)] hover:-translate-y-[2px]" 
                onClick={() => setShowModal(true)}
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <MessageWidget />

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-end bg-black bg-opacity-50 z-50">
          <div
            ref={modalRef}
            className="pt-20 relative bg-white p-0 max-w-lg w-full max-h-[100vh] overflow-y-auto"
          >
            <DiliveryAndPayment totalPrice={totalPrice} onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}  
    </>
  );
}

// Using Suspense is a good practice in Next.js when dealing with search parameters.
function CheckOutPage() {
  return (
    <Suspense fallback={<div className="text-center mt-[100px] text-[1.2rem] text-[#555]">Loading Checkout...</div>}>
      <CheckOutContent />
    </Suspense>
  );
}

export default CheckOutPage;