"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import { toast } from "react-toastify";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // Show success toast
    toast.success("Payment Successfully", {
      position: "top-center",
      autoClose: 4000,
    });
  }, []);

  return (
    <>
      <Navbar alwaysVisible={true} />
      <main className="min-h-[70vh] flex flex-col items-center justify-center bg-[#CCF6F2] px-4 pt-20 pb-16">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-3">Payment Successful!</h1>
          <p className="text-[#555] mb-2">Thank you for your purchase.</p>
          {orderId && (
            <p className="text-sm text-[#777] mb-8">Order ID: <span className="font-mono font-semibold">#{orderId}</span></p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/bag_page")}
              className="px-6 py-3 rounded-xl bg-white border border-[#ddd] text-[#333] hover:bg-gray-50 transition"
            >
              Back to My Bag
            </button>
            <button
              onClick={() => router.push("/products")}
              className="px-6 py-3 rounded-xl bg-[#eb61a2] text-white hover:bg-[#d94d8c] transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
