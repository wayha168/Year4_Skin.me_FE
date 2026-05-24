"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function DiscountModal() {
  const [open, setOpen] = useState(false);

  // Show modal only on first visit (or always in development)
  useEffect(() => {
    const isDev = process.env.NODE_ENV === "development";
    const hasSeen = localStorage.getItem("hasSeenDiscountModal");

    if (isDev || !hasSeen) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, []);

  const closeModal = () => {
    setOpen(false);

    // Only remember "seen" in production
    if (process.env.NODE_ENV !== "development") {
      localStorage.setItem("hasSeenDiscountModal", "true");
    }
  };

  // Close with ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && open) {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md"
      onClick={closeModal}
    >
      {/* Modal */}
      <div
        className="relative flex w-[900px] overflow-hidden rounded-[28px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side */}
        <div className="w-[42%] bg-black p-5 text-white">
          <div className="overflow-hidden rounded-2xl">
            <img
              src="/assets/ModalDiscountImage/torriden.jpg"
              alt="Skincare"
              className="h-[360px] w-full object-cover"
            />
          </div>

          <h1 className="mt-6 text-[2.5rem] font-bold leading-tight">
            Happy shopping
          </h1>
        </div>

        {/* Right Side */}
        <div className="relative flex-1 p-8">
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute right-6 top-5 z-10"
          >
            <X className="h-8 w-8 text-red-500" />
          </button>

          {/* Content */}
          <p className="flex text-center text-2xl text-gray-500">
            Special Offer
          </p>

          <h2 className="mt-6 text-6xl font-black leading-none">
            UP TO 70% OFF
          </h2>

          <p className="mt-6 text-[20px] leading-relaxed text-gray-500">
            Discover skincare made for healthy, glowing skin. 
            Enjoy exclusive discounts on best-selling serums, 
            cleansers, and moisturizers for a limited time only. 
            Treat your skin with premium care at a special price.
          </p>

          {/* Button */}
          <button 
            onClick={closeModal}
            className="mt-8 rounded-2xl bg-pink-500 px-8 py-4 text-xl font-semibold text-white transition hover:scale-105"
          >
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}