"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import axiosAuth from "../../app/lib/api/axiosConfig.js";

const DEFAULT_IMAGE = "/assets/ModalDiscountImage/torriden.jpg";

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_BASE_URL ?? "";

export default function DiscountModal() {
  const [open, setOpen] = useState(false);

  const [modalData, setModalData] = useState({
    heading: "Happy shopping",
    badgeText: "Special Offer",
    percentText: "",
    description:
      "Discover skincare made for healthy, glowing skin. Enjoy exclusive discounts on best-selling serums, cleansers, and moisturizers for a limited time only. Treat your skin with premium care at a special price.",
    imageSrc: DEFAULT_IMAGE,
    ctaText: "Shop Now",
  });

  const [promotionsList, setPromotionsList] = useState([]);
  const [selectedPromotionIndex, setSelectedPromotionIndex] = useState(0);

  const extractPercent = (obj) => {
    let val =
      obj?.discountPercentage ??
      obj?.discount_percentage ??
      obj?.discountPercent ??
      obj?.discount_percent ??
      obj?.percent ??
      obj?.value;
    if (typeof val === "number") return val;
    if (typeof val === "string" && val.trim() !== "") return Number(val);
    return null;
  };

  const selectedPromotion = promotionsList[selectedPromotionIndex];
  const selectedPercent = extractPercent(selectedPromotion);

  const resolveImageUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim() === "") return null;
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
    if (CDN_BASE_URL) return `${CDN_BASE_URL.replace(/\/$/, "")}/${rawUrl.replace(/^\//, "")}`;
    return rawUrl;
  };

  const getPromoImage = (obj) => {
    const directFields = [
      obj?.image,
      obj?.imageUrl,
      obj?.image_url,
      obj?.bannerImage,
      obj?.banner_image,
      obj?.thumbnail,
      obj?.thumbnailUrl,
      obj?.thumbnail_url,
      obj?.photo,
      obj?.photoUrl,
      obj?.productImage,
      obj?.product_image,
      obj?.promotionImage,
      obj?.promotion_image,
    ];

    for (const field of directFields) {
      if (typeof field === "string" && field.trim() !== "") {
        return resolveImageUrl(field);
      }
    }

    const imageKey = obj?.ImageKey ?? obj?.imageKey ?? obj?.image_key;
    if (typeof imageKey === "string" && imageKey.trim() !== "") {
      return resolveImageUrl(imageKey);
    }

    const imgObj = obj?.image ?? obj?.imageObj ?? obj?.media;
    if (imgObj && typeof imgObj === "object") {
      const nested = imgObj?.downloadUrl ?? imgObj?.url ?? imgObj?.src;
      if (typeof nested === "string" && nested.trim() !== "") return resolveImageUrl(nested);
    }

    const imagesArr = obj?.images ?? obj?.mediaList ?? obj?.photos ?? obj?.gallery;
    if (Array.isArray(imagesArr) && imagesArr.length > 0) {
      const first = imagesArr[0];
      if (typeof first === "string") return resolveImageUrl(first);
      const nested = first?.downloadUrl ?? first?.url ?? first?.src ?? first?.imageUrl;
      if (typeof nested === "string" && nested.trim() !== "") return resolveImageUrl(nested);
    }

    if (obj?.product) {
      const productImg = getPromoImage(obj.product);
      if (productImg) return productImg;
    }

    const nestedListFields = ["items", "products", "variants"];
    for (const key of nestedListFields) {
      if (Array.isArray(obj?.[key]) && obj[key].length > 0) {
        const img = getPromoImage(obj[key][0]);
        if (img) return img;
      }
    }

    return null;
  };

  const fetchDiscountData = async () => {
    try {
      const response = await axiosAuth.get("/promotions/all");


      const raw = response?.data;
      const payload = raw?.data ?? raw;

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

      if (normalizedPromotions.length === 0) {
        setPromotionsList([]);
        return;
      }

      const displayPromotions = normalizedPromotions.slice(0, 6);
      let maxPercent = 0;
      let maxPercentPromotion = displayPromotions[0];
      let maxPercentPromotionIndex = 0;

      for (const [index, p] of displayPromotions.entries()) {
        const pct = extractPercent(p);
        if (pct !== null && pct > maxPercent) {
          maxPercent = pct;
          maxPercentPromotion = p;
          maxPercentPromotionIndex = index;
        }
      }

      const heading =
        maxPercentPromotion?.title ??
        maxPercentPromotion?.heading ??
        maxPercentPromotion?.name ??
        "Happy shopping";

      const badgeText =
        maxPercentPromotion?.badgeTitle ??
        maxPercentPromotion?.badge ??
        maxPercentPromotion?.offerTitle ??
        "Special Offer";

      const description =
        maxPercentPromotion?.description ??
        maxPercentPromotion?.detail ??
        maxPercentPromotion?.details ??
        maxPercentPromotion?.summaryLine ??
        "Discover skincare made for healthy, glowing skin. Enjoy exclusive discounts on best-selling serums, cleansers, and moisturizers for a limited time only. Treat your skin with premium care at a special price.";

      const ctaText =
        maxPercentPromotion?.ctaText ??
        maxPercentPromotion?.cta ??
        maxPercentPromotion?.buttonText ??
        maxPercentPromotion?.button_text ??
        "Shop Now";

      const imageSrc = getPromoImage(maxPercentPromotion) || DEFAULT_IMAGE;

      const promotionsWithImage = displayPromotions.map((p) => ({
        ...p,
        __resolvedImageSrc: getPromoImage(p) || DEFAULT_IMAGE,
      }));

      setPromotionsList(promotionsWithImage);
      setSelectedPromotionIndex(maxPercentPromotionIndex);

      setModalData({
        heading,
        badgeText,
        percentText: maxPercent > 0 ? `UP TO ${Math.round(maxPercent)}% OFF` : "",
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
    if (process.env.NODE_ENV !== "development") {
      localStorage.setItem("hasSeenDiscountModal", "true");
    }
  };

  // ── Dot navigation: clicking a dot switches both the left image and the right panel data ──
  const handleDotClick = (idx) => {
    const p = promotionsList[idx];
    if (!p) return;

    setSelectedPromotionIndex(idx);

    const heading = p?.title ?? p?.heading ?? p?.name ?? "Happy shopping";
    const badgeText = p?.badgeTitle ?? p?.badge ?? p?.offerTitle ?? "Special Offer";
    const description =
      p?.description ??
      p?.detail ??
      p?.details ??
      p?.summaryLine ??
      modalData.description;
    const ctaText =
      p?.ctaText ?? p?.cta ?? p?.buttonText ?? p?.button_text ?? "Shop Now";
    const imgResolved = p?.__resolvedImageSrc;

    setModalData((prev) => ({
      ...prev,
      heading,
      badgeText,
      description,
      imageSrc:
        typeof imgResolved === "string" && imgResolved.trim() !== ""
          ? imgResolved
          : prev.imageSrc,
      ctaText,
    }));
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      const handleEsc = (e) => {
        if (e.key === "Escape") closeModal();
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
      <div
        className="relative flex w-[94%] max-w-[340px] sm:max-w-[420px] md:max-w-[680px] max-h-[82vh] overflow-hidden rounded-[20px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left panel ── */}
        <div className="w-[42%] bg-black p-3 sm:p-4 text-white flex flex-col">

          {/* Main sliding image with CSS transition */}
          <div className="relative overflow-hidden rounded-2xl flex-shrink-0">
            {selectedPercent && selectedPercent > 0 ? (
              <div className="absolute left-2 top-2 z-10 rounded-full bg-pink-500 px-2.5 py-1 text-[11px] sm:text-xs font-extrabold leading-none text-white shadow-lg">
                {Math.round(selectedPercent)}% OFF
              </div>
            ) : null}
            <img
              key={modalData.imageSrc}
              src={modalData.imageSrc}
              alt={modalData.heading || "Skincare"}
              className="h-[30vh] max-h-[220px] sm:max-h-[260px] w-full object-cover transition-opacity duration-500 ease-in-out animate-fadeIn"
              onError={(e) => {
                if (e.currentTarget.src !== DEFAULT_IMAGE) {
                  e.currentTarget.src = DEFAULT_IMAGE;
                }
              }}
            />
          </div>

          {/* Dot indicators — only show when there are multiple promotions */}
          {promotionsList.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {promotionsList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to promotion ${idx + 1}`}
                  onClick={() => handleDotClick(idx)}
                  className={[
                    "rounded-full transition-all duration-300 focus:outline-none",
                    idx === selectedPromotionIndex
                      ? "bg-pink-400 w-6 h-3"       // active: bigger pill shape
                      : "bg-white/40 hover:bg-white/70 w-3 h-3", // inactive: bigger circle
                  ].join(" ")}
                />
              ))}
            </div>
          )}

          <h1 className="mt-4 text-[1.75rem] sm:text-[2rem] font-bold leading-tight">
            {modalData.heading}
          </h1>
        </div>

        {/* ── Right panel ── */}
        <div className="relative flex-1 p-4 sm:p-5 md:p-7 overflow-y-auto">
          <button onClick={closeModal} className="absolute right-1 top-1 z-10">
            <X className="h-8 w-8 text-red-500" />
          </button>

          {promotionsList?.length ? (
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-2">
                {promotionsList.slice(0, 6).map((p, idx) => {
                  const isSelected = idx === selectedPromotionIndex;
                  const badge =
                    p?.badgeTitle ?? p?.badge ?? p?.offerTitle ?? p?.title ?? "Offer";
                  const percentNum = extractPercent(p);

                  return (
                    <button
                      key={p?.id ?? idx}
                      type="button"
                      onClick={() => handleDotClick(idx)}
                      className={
                        "rounded-xl border px-2 py-2 text-left transition " +
                        (isSelected
                          ? "border-pink-400 bg-pink-50"
                          : "border-gray-200 bg-white hover:border-gray-300")
                      }
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={p?.__resolvedImageSrc || DEFAULT_IMAGE}
                          alt={badge}
                          className="h-6 w-6 rounded object-cover"
                          onError={(e) => {
                            if (e.currentTarget.src !== DEFAULT_IMAGE) {
                              e.currentTarget.src = DEFAULT_IMAGE;
                            }
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-gray-600 line-clamp-1">
                            {badge}
                          </div>
                          <div className="mt-0.5 text-[13px] font-extrabold text-[#eb61a2]">
                            {percentNum && percentNum > 0
                              ? `${Math.round(percentNum)}%`
                              : ""}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <p className="flex text-center text-2xl text-gray-500">{modalData.badgeText}</p>

          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black leading-none">
            {modalData.percentText}
          </h2>

          <p className="mt-3 text-[13.5px] sm:text-[15px] md:text-[16px] leading-relaxed text-gray-500">
            {modalData.description}
          </p>

          <button
            onClick={closeModal}
            className="mt-4 sm:mt-5 rounded-2xl bg-pink-500 px-5 py-2.5 sm:py-3 text-base sm:text-lg md:text-xl font-semibold text-white transition hover:scale-105"
          >
            {modalData.ctaText}
          </button>
        </div>
      </div>

      {/* Fade-in keyframe — add this once to your global CSS instead if preferred */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(1.03); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
