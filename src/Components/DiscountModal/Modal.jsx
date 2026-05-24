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

  // Lock body scroll when modal is open + ESC key
  useEffect(() => {
    if (open) {
      // Prevent background scrolling (more reliable)
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      const handleEsc = (e) => {
        if (e.key === "Escape") {
          closeModal();
        }
      };

      window.addEventListener("keydown", handleEsc);

      return () => {
        window.removeEventListener("keydown", handleEsc);
        document.body.style.overflow = "unset";
        document.documentElement.style.overflow = "unset";
      };
    } else {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-md"
      onClick={closeModal}
      style={{ touchAction: 'none' }}
    >
      {/* Modal */}
        <div
          className="relative flex w-[94%] max-w-[340px] sm:max-w-[420px] md:max-w-[680px] max-h-[82vh] overflow-hidden rounded-[20px] bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Left Side */}
        <div className="w-[42%] bg-black p-3 sm:p-4 text-white">
          <div className="overflow-hidden rounded-2xl">
            <img
              src="/assets/ModalDiscountImage/torriden.jpg"
              alt="Skincare"
              className="h-[30vh] max-h-[220px] sm:max-h-[260px] w-full object-cover"
            />
          </div>

          <h1 className="mt-4 text-[1.75rem] sm:text-[2rem] font-bold leading-tight">
            Happy shopping
          </h1>
        </div>

        {/* Right Side */}
        <div className="relative flex-1 p-4 sm:p-5 md:p-7">
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

          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black leading-none">
            UP TO 70% OFF
          </h2>

          <p className="mt-3 text-[13.5px] sm:text-[15px] md:text-[16px] leading-relaxed text-gray-500">
            Discover skincare made for healthy, glowing skin. 
            Enjoy exclusive discounts on best-selling serums, 
            cleansers, and moisturizers for a limited time only. 
            Treat your skin with premium care at a special price.
          </p>

          {/* Button */}
          <button 
            onClick={closeModal}
            className="mt-4 sm:mt-5 rounded-2xl bg-pink-500 px-5 py-2.5 sm:py-3 text-base sm:text-lg md:text-xl font-semibold text-white transition hover:scale-105"
          >
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}