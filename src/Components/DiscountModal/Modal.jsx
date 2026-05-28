"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import axiosAuth from "../../app/lib/api/axiosConfig.js";
import { getProductImageUrl } from "../../app/lib/productImage.js";

export default function DiscountModal() {
  const [open, setOpen] = useState(false);

  const [modalData, setModalData] = useState({
    heading: "Happy shopping",
    badgeText: "Special Offer",
    percentText: "UP TO 70% OFF",
    description:
      "Discover skincare made for healthy, glowing skin. Enjoy exclusive discounts on best-selling serums, cleansers, and moisturizers for a limited time only. Treat your skin with premium care at a special price.",
    imageSrc: "/assets/ModalDiscountImage/torriden.jpg",
    ctaText: "Shop Now",
  });

  const [promotionsList, setPromotionsList] = useState([]);
  const [selectedPromotionIndex, setSelectedPromotionIndex] = useState(0);

  const fetchDiscountData = async () => {
    try {
      // Prefer token-aware axiosAuth (baseURL configured by NEXT_PUBLIC_API_BASE)
      const response = await axiosAuth.get("/promotions/all");

      // API responses can vary; normalize safely.
      const raw = response?.data;
      const payload = raw?.data ?? raw;

      // promotions/all is expected to return an array (but backend may wrap it)
      const promotions = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.promotions)
          ? payload.promotions
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      const normalizedPromotions = Array.isArray(promotions)
        ? promotions
        : (payload?.discount ?? payload?.promotion ?? payload)
          ? [payload?.discount ?? payload?.promotion ?? payload]
          : [];

      // Choose first promotion for the big/details section by default.
      const promotion = normalizedPromotions?.length ? normalizedPromotions[0] : {};

      // If we want to render a grid of promotions, also store the normalized list.
      setPromotionsList(normalizedPromotions || []);
      setSelectedPromotionIndex(0);

      // Try common field names across backends

      const percentRaw =
        promotion?.discountPercentage ??
        promotion?.discount_percentage ??
        promotion?.discountPercent ??
        promotion?.discount_percent ??
        promotion?.percent ??
        promotion?.value;

      const percent =
        typeof percentRaw === "number"
          ? percentRaw
          : typeof percentRaw === "string" && percentRaw.trim() !== ""
            ? Number(percentRaw)
            : null;

      const heading = promotion?.title ?? promotion?.heading ?? promotion?.name ?? "Happy shopping";
      const badgeText = promotion?.badgeTitle ?? promotion?.badge ?? promotion?.offerTitle ?? "Special Offer";

      // Description: backend may provide it, but if it's empty fall back to summaryLine.
      const description =
        promotion?.description ??
        promotion?.detail ??
        promotion?.details ??
        promotion?.summaryLine ??
        "Discover skincare made for healthy, glowing skin. Enjoy exclusive discounts on best-selling serums, cleansers, and moisturizers for a limited time only. Treat your skin with premium care at a special price.";

      const ctaText =
        promotion?.ctaText ?? promotion?.cta ?? promotion?.buttonText ?? promotion?.button_text ?? "Shop Now";

      // 1) Use promotion image if backend gives it.
      const imageSrcRaw =
        promotion?.imageUrl ??
        promotion?.image ??
        promotion?.image_url ??
        promotion?.bannerImage ??
        promotion?.banner_image;

      // 2) If missing, fetch related product and reuse existing product image helper.
      let imageSrc = "/assets/ModalDiscountImage/torriden.jpg";
      if (typeof imageSrcRaw === "string" && imageSrcRaw.trim() !== "") {
        imageSrc = imageSrcRaw;
      } else if (promotion?.productId != null) {
        try {
          const productId = Number(promotion.productId);
          if (!Number.isNaN(productId)) {
            const productRes = await axiosAuth.get(`/products/${productId}`).catch(() => null);
            const product = productRes?.data?.data ?? productRes?.data ?? null;
            if (product) {
              imageSrc = getProductImageUrl(product);
            }
          }
        } catch {
          // keep fallback
        }
      }

      // Keep a resolved image field per promotion (best-effort) for the grid cards.
      const promotionsWithImage = await Promise.all(
        (normalizedPromotions || []).slice(0, 6).map(async (p) => {
          const imgRaw = p?.imageUrl ?? p?.image ?? p?.image_url ?? p?.bannerImage ?? p?.banner_image;

          if (typeof imgRaw === "string" && imgRaw.trim() !== "") {
            return { ...p, __resolvedImageSrc: imgRaw };
          }

          if (p?.productId != null) {
            const productId = Number(p.productId);
            if (!Number.isNaN(productId)) {
              try {
                const productRes = await axiosAuth.get(`/products/${productId}`).catch(() => null);
                const product = productRes?.data?.data ?? productRes?.data ?? null;
                if (product) {
                  return { ...p, __resolvedImageSrc: getProductImageUrl(product) };
                }
              } catch {
                // ignore
              }
            }
          }

          return { ...p, __resolvedImageSrc: imageSrc };
        }),
      );

      // Save full list for grid UI (cards)
      setPromotionsList(normalizedPromotions || []);
      setSelectedPromotionIndex(0);

      setModalData({
        heading,
        badgeText,
        percentText: percent && percent > 0 ? `UP TO ${Math.round(percent)}% OFF` : "UP TO 70% OFF",
        description,
        imageSrc,
        ctaText,
      });

    } catch (error) {
      console.error("[DiscountModal] Error fetching discount data:", error);
    }
  };

  useEffect(() => {
    fetchDiscountData();
  }, []);

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
      style={{ touchAction: "none" }}
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
              src={modalData.imageSrc}
              alt={modalData.heading || "Skincare"}
              className="h-[30vh] max-h-[220px] sm:max-h-[260px] w-full object-cover"
            />
          </div>

          <h1 className="mt-4 text-[1.75rem] sm:text-[2rem] font-bold leading-tight">{modalData.heading}</h1>
        </div>

        {/* Right Side */}
        <div className="relative flex-1 p-4 sm:p-5 md:p-7">
          {/* Close Button */}
          <button onClick={closeModal} className="absolute right-6 top-5 z-10">
            <X className="h-8 w-8 text-red-500" />
          </button>

          {/* Promotion grid (cards) */}
          {promotionsList?.length ? (
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-2">
                {promotionsList.slice(0, 6).map((p, idx) => {
                  const isSelected = idx === selectedPromotionIndex;
                  const badge = p?.badgeTitle ?? p?.badge ?? p?.offerTitle ?? p?.title ?? "Offer";
                  const percentRaw =
                    p?.discountPercentage ??
                    p?.discount_percentage ??
                    p?.discountPercent ??
                    p?.discount_percent ??
                    p?.percent ??
                    p?.value;
                  const percentNum =
                    typeof percentRaw === "number"
                      ? percentRaw
                      : typeof percentRaw === "string" && percentRaw.trim() !== ""
                        ? Number(percentRaw)
                        : null;

                  return (
                    <button
                      key={p?.id ?? idx}
                      type="button"
                      onClick={() => {
                        setSelectedPromotionIndex(idx);
                        // Swap big details section to selected promotion
                        const heading = p?.title ?? p?.heading ?? p?.name ?? "Happy shopping";
                        const badgeText = p?.badgeTitle ?? p?.badge ?? p?.offerTitle ?? "Special Offer";
                        const description =
                          p?.description ??
                          p?.detail ??
                          p?.details ??
                          p?.summaryLine ??
                          modalData.description;
                        const ctaText = p?.ctaText ?? p?.cta ?? p?.buttonText ?? p?.button_text ?? "Shop Now";

                        const imgResolved =
                          p?.__resolvedImageSrc ||
                          p?.imageUrl ||
                          p?.image ||
                          p?.image_url ||
                          p?.bannerImage ||
                          p?.banner_image;

                        setModalData((prev) => ({
                          ...prev,
                          heading,
                          badgeText,
                          percentText:
                            percentNum && percentNum > 0
                              ? `UP TO ${Math.round(percentNum)}% OFF`
                              : prev.percentText,
                          description,
                          imageSrc:
                            typeof imgResolved === "string" && imgResolved.trim() !== ""
                              ? imgResolved
                              : prev.imageSrc,
                          ctaText,
                        }));
                      }}
                      className={
                        "rounded-xl border px-2 py-2 text-left transition " +
                        (isSelected
                          ? "border-pink-400 bg-pink-50"
                          : "border-gray-200 bg-white hover:border-gray-300")
                      }
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={p?.__resolvedImageSrc || modalData.imageSrc}
                          alt={badge}
                          className="h-6 w-6 rounded object-cover"
                        />
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-gray-600 line-clamp-1">{badge}</div>
                          <div className={"mt-0.5 text-[13px] font-extrabold text-[#eb61a2]"}>
                            {percentNum && percentNum > 0 ? `${Math.round(percentNum)}%` : ""}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Content */}
          <p className="flex text-center text-2xl text-gray-500">{modalData.badgeText}</p>

          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black leading-none">
            {modalData.percentText}
          </h2>

          <p className="mt-3 text-[13.5px] sm:text-[15px] md:text-[16px] leading-relaxed text-gray-500">
            {modalData.description}
          </p>

          {/* Button */}
          <button
            onClick={closeModal}
            className="mt-4 sm:mt-5 rounded-2xl bg-pink-500 px-5 py-2.5 sm:py-3 text-base sm:text-lg md:text-xl font-semibold text-white transition hover:scale-105"
          >
            {modalData.ctaText}
          </button>
        </div>
      </div>
    </div>
  );
}
