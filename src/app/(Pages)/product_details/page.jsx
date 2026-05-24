"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import axiosAuth from "../../../app/lib/api/axiosConfig";
import axios from "axios";
import { API_BASE } from "../../../app/lib/api/config";

import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import Loading from "../../../Components/Loading/Loading";
import useUserActions from "../../../Components/Hooks/userUserActions";
import useAuthContext from "../../../app/lib/Authentication/AuthContext";
import { FaCartPlus, FaHeart, FaArrowLeft } from "react-icons/fa";
import { getProductImageUrl, getProductImageUrlFromItem } from "../../../app/lib/productImage";
import { formatPrice } from "../../../app/lib/formatPrice";
import ProductPrice from "../../../Components/ProductPrice/ProductPrice";

const DefaultImage = "/assets/third_image.png";

/**
 * The main component that fetches and displays product details.
 * It uses useSearchParams, which requires a Suspense boundary.
 */
const ProductDetailsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("productId");
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState({ show: false, x: 50, y: 50, lensX: 0, lensY: 0 });
  const galleryRef = useRef(null);
  const { user } = useAuthContext();
  const { addToCart, addToFavorite, removeFavorite } = useUserActions();
  const [productFeedbacks, setProductFeedbacks] = useState([]);
  const [mainDiscountedPrice, setMainDiscountedPrice] = useState(null);
  const [relatedDiscountedPrices, setRelatedDiscountedPrices] = useState({});
  const [mainDiscountPercentage, setMainDiscountPercentage] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const fetchProductFeedbacks = async (prodId) => {
    try {
      const res = await axios.get(`${API_BASE}/feedback/product/all-feedback`);
      const feedbackData = res?.data?.data;
      const allFeedbacks = Array.isArray(feedbackData?.content)
        ? feedbackData.content
        : Array.isArray(feedbackData)
        ? feedbackData
        : [];
      const filtered = allFeedbacks.filter((f) => f?.productId === Number(prodId) || f?.productId === prodId);
      setProductFeedbacks(filtered);
    } catch (err) {
      setProductFeedbacks([]);
    }
  };

  const handleZoomMove = (clientX, clientY) => {
    if (!galleryRef.current) return;
    const rect = galleryRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setZoom((z) => ({ ...z, show: false }));
      return;
    }
    // Clamp lens inside image bounds (important for large backend PNGs)
    const lensSize = 250;
    x = Math.max(lensSize / 2, Math.min(x, rect.width - lensSize / 2));
    y = Math.max(lensSize / 2, Math.min(y, rect.height - lensSize / 2));
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;
    setZoom({ show: true, x: percentX, y: percentY, lensX: x, lensY: y });
  };

  const handleZoomEnd = () => setZoom((z) => ({ ...z, show: false }));

  const brandName = product ? (typeof product.brand === "string" ? product.brand : product.brand?.name ?? "") : "";

  const maxStock = product
    ? Math.max(1, Number(product.inventory ?? product.stock ?? product.quantity ?? product.available ?? 999))
    : 999;

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [productId]);

  useEffect(() => {
    if (!productId) {
      setError("No product ID provided.");
      setLoading(false);
      return;
    }

    const fetchProductDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get(`${API_BASE}/products/all`);
        const allProducts = response.data?.data || response.data || [];
        const productData = allProducts.find((p) => p.id === Number(productId));

        if (productData) {
          setProduct(productData);
          fetchRelatedProductsByBrand(productData, productData.id);
          fetchProductFeedbacks(productData.id);
        } else {
          setError("Product not found. Please check the product ID.");
        }
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Could not load product details.");
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedProductsByBrand = async (currentProduct, currentProductId) => {
      try {
        const response = await axios.get(`${API_BASE}/products/all`);
        const allProducts = response.data?.data || response.data || [];
        const brandId = currentProduct?.brand?.id ?? null;
        const brandName = typeof currentProduct?.brand === "string" ? currentProduct.brand : currentProduct?.brand?.name ?? "";

        const sameBrand = (p) => {
          if (p.id === Number(currentProductId)) return false;
          if (brandId != null && p?.brand?.id != null) return p.brand.id === brandId;
          const pName = typeof p?.brand === "string" ? p.brand : p?.brand?.name ?? "";
          return brandName && pName && String(pName).toLowerCase() === String(brandName).toLowerCase();
        };

        const related = allProducts.filter(sameBrand).slice(0, 5);
        setRelatedProducts(related);
      } catch (err) {
      }
    };

    fetchProductDetails();
  }, [productId]);

  // Fetch discounts for main product + recommended products
  useEffect(() => {
    const fetchDiscounts = async () => {
      const idsToFetch = new Set();

      if (product?.id) idsToFetch.add(product.id);
      relatedProducts.forEach(p => p?.id && idsToFetch.add(p.id));

      if (idsToFetch.size === 0) return;

      const promises = Array.from(idsToFetch).map(async (pid) => {
        try {
          const res = await axios.get(`${API_BASE}/promotions/product/${pid}/discounted-price`);
          const data = res.data?.data;
          let final = null;
          if (typeof data === "number") final = data;
          else if (data && typeof data === "object") {
            final = data.discountedPrice ?? data.price ?? data.finalPrice ?? data.discounted_price ?? null;
          }
          return [pid, final != null ? Number(final) : null];
        } catch {
          return [pid, null];
        }
      });

      const results = await Promise.all(promises);
      const newMap = { ...relatedDiscountedPrices };

      results.forEach(([pid, val]) => {
        if (pid === product?.id) {
          setMainDiscountedPrice(val);
        } else {
          newMap[pid] = val;
        }
      });

      setRelatedDiscountedPrices(newMap);
    };

    fetchDiscounts();

    // Also fetch discount percentage for main product (for the % OFF label)
    const fetchMainDiscountPercentage = async () => {
      if (!product?.id) {
        setMainDiscountPercentage(null);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/promotions/product/${product.id}`);
        const promo = res.data?.data;
        if (promo && typeof promo === "object") {
          const raw = promo.discountPercentage ?? promo.discount_percentage ?? promo.discountPercent ?? promo.discount_percent ?? null;
          if (typeof raw === "number" && raw > 0) {
            setMainDiscountPercentage(Math.round(raw));
            return;
          }
        }
        setMainDiscountPercentage(null);
      } catch {
        setMainDiscountPercentage(null);
      }
    };
    fetchMainDiscountPercentage();
  }, [product, relatedProducts]);

  // Fetch favorites for heart color (focus only on icon color)
  useEffect(() => {
    const fetchFavoritesForColor = async () => {
      if (!user?.id) {
        setFavoriteIds(new Set());
        return;
      }
      try {
        const res = await axiosAuth.get(`/favorites/user/${user.id}`, { withCredentials: true });
        const favs = res.data?.data || [];
        const ids = new Set(favs.map(f => f.product?.id ?? f.productId).filter(Boolean).map(Number));
        setFavoriteIds(ids);
      } catch {
        setFavoriteIds(new Set());
      }
    };
    fetchFavoritesForColor();
  }, [user]);

  const handleToggleFavorite = useCallback(async (productId) => {
    if (!user) {
      return;
    }

    const pid = Number(productId);
    const isFavorited = favoriteIds.has(pid);

    try {
      if (isFavorited) {
        await removeFavorite(pid);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(pid);
          return next;
        });
      } else {
        await addToFavorite(pid);
        setFavoriteIds((prev) => new Set(prev).add(pid));
      }
    } catch {
      // error toast is handled inside the hook
    }
  }, [user, addToFavorite, removeFavorite, favoriteIds]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-center mt-20">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <p className="text-gray-600">Product ID: {productId}</p>
        <p className="text-sm text-gray-500 mt-2">Check the browser console for detailed error logs</p>
      </div>
    );
  }

  if (!product) {
    return <p className="text-center text-gray-500 text-lg mt-20">Product not found.</p>;
  }

  const mainImageSrc =
    product?.images?.[selectedImageIndex]
      ? getProductImageUrlFromItem(product.images[selectedImageIndex], DefaultImage)
      : product?.images?.[0]
        ? getProductImageUrlFromItem(product.images[0], DefaultImage)
        : DefaultImage;

  // Once product is loaded, display it – SKIN1004-style clean layout
  return (
    <>
      <div className="max-w-6xl mx-auto">
{/* Breadcrumb / back */}
           <div className="mb-6">
             <Link href="/products" className="group">
               <FaArrowLeft className="text-2xl text-gray-700 transition-transform duration-200 group-hover:text-[#eb61a2] group-hover:-translate-x-1" />
             </Link>
           </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
{/* Gallery with hover/touch zoom */}
          <div className="space-y-4">
            <div
              ref={galleryRef}
              className="relative aspect-square w-full max-w-lg mx-auto rounded-2xl cursor-zoom-in bg-white overflow-hidden"
              onMouseEnter={(e) => handleZoomMove(e.clientX, e.clientY)}
              onMouseMove={(e) => handleZoomMove(e.clientX, e.clientY)}
              onMouseLeave={handleZoomEnd}
              onTouchStart={(e) => {
                const t = e.touches[0];
                if (t) handleZoomMove(t.clientX, t.clientY);
              }}
              onTouchMove={(e) => {
                const t = e.touches[0];
                if (t) handleZoomMove(t.clientX, t.clientY);
              }}
              onTouchEnd={handleZoomEnd}
              onTouchCancel={handleZoomEnd}
            >
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <Image
                  src={mainImageSrc}
                  alt={product.images?.[selectedImageIndex]?.fileName || product.images?.[0]?.fileName || product.name}
                  fill
                  className="object-cover pointer-events-none select-none transition-transform duration-200"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                  priority
                  draggable={false}
                />
              </div>
              {/* Zoom lens – follows cursor/hold, shows 2.5x zoom (like SKIN1004) */}
              {zoom.show && (
                <div
                  className="absolute pointer-events-none rounded-full border-2 border-white shadow-xl overflow-hidden z-10"
                  style={{
                    width: 250,
                    height: 250,
                    left: zoom.lensX - 125,
                    top: zoom.lensY - 125,
                  }}
                >
                  <img
                    src={mainImageSrc}
                    alt=""
                    className="absolute pointer-events-none select-none"
                    style={{
                      width: "400%",
                      height: "400%",
                      objectFit: "cover",
                      top: "50%",
                      left: "50%",
                      transform: `translate(${-zoom.x * 2}%, ${-zoom.y * 2}%) translate(50%, 50%)`,
                    }}
                    draggable={false}
                  />
                </div>
              )}
            </div>
            {product?.images?.length > 1 && (
              <div className="flex gap-2 justify-center flex-wrap">
                {product.images.map((img, idx) => (
                  <button
                    key={img.imageId ?? idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#eb61a2] focus:ring-offset-2 ${
                      selectedImageIndex === idx ? "border-[#eb61a2]" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={getProductImageUrlFromItem(img, DefaultImage)}
                      alt={img.fileName || `${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:pt-2">
            {brandName && (
              <p className="text-[1.3rem] font-medium text-gray-500 uppercase tracking-widest mb-2">{brandName}</p>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-3">
              {product.name}
            </h1>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {product.description?.split(".")[0]?.trim() || product.description || "Skincare product."}
            </p>

            {/* Price */}
            <div className="mb-7">
              {mainDiscountPercentage != null && (
                <p className="text-[#eb61a2] text-[2rem]  font-semibold  mb-0.5">
                  {mainDiscountPercentage}% OFF
                </p>
              )}
              <p className="text-sm text-gray-500 mb-0.5"> Price</p>
              <ProductPrice 
                price={product.price} 
                discountedPrice={mainDiscountedPrice}
                originalClassName="line-through text-gray-400 text-2xl"
                discountedClassName="text-2xl font-bold text-gray-900"
                priceClassName="text-2xl font-bold text-gray-900"
              />
              {(product.skinType ?? product.skin_type) != null &&
                (Array.isArray(product.skinType ?? product.skin_type)
                  ? (product.skinType ?? product.skin_type).length > 0
                  : (product.skinType ?? product.skin_type) !== "") && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium text-gray-700">Skin type:</span>{" "}
                  {Array.isArray(product.skinType ?? product.skin_type)
                    ? (product.skinType ?? product.skin_type).join(", ")
                    : (product.skinType ?? product.skin_type)}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-1">
                <span className="text-sm font-medium text-gray-700">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity === 1}
                    className={`w-11 h-11 flex items-center font-bold text-[1.3rem] justify-center transition-colors ${quantity === 1 ? "text-[#CACACA] cursor-not-allowed" : "text-gray-600 hover:bg-[#B0D8D4]"}`}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-12 text-center  font-semibold text-gray-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    disabled={quantity >= maxStock}
                    className={`w-11 h-11 flex items-center font-bold text-[1.3rem] justify-center transition-colors ${quantity >= maxStock ? "text-[#CACACA] cursor-not-allowed" : "text-gray-600 hover:bg-[#B0D8D4]"}`}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              {maxStock < 999 && (
                <p className="text-xs text-gray-500">Only {maxStock} left in stock</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => addToCart(product.id, quantity)}
                className="flex-1 min-w-[200px] bg-[#eb61a2] text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:bg-[#d13e82] active:scale-[0.98]"
              >
                <FaCartPlus className="text-lg" /> Add to Bag
              </button>
              <button
                onClick={() => handleToggleFavorite(product.id)}
                className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 hover:border-[#F83E94] hover:text-[#F83E94] transition-colors"
                aria-label="Add to favorites"
              >
                <FaHeart className={`text-lg ${favoriteIds.has(Number(product?.id)) ? 'text-[#F83E94]' : 'text-[#2F2F2F]'}`} />
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-500">Free shipping on orders over a certain amount.</p>
          </div>
        </div>

        {/* Product details, How to use, Skin type, Product type – display all when present */}
        <div className="mt-14 pt-10 border-t border-gray-100 space-y-10">
          {(product.description != null && product.description !== "") && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Product details</h2>
              <p className="text-gray-600 leading-relaxed max-w-2xl whitespace-pre-line">
                {product.description}
              </p>
            </section>
          )}

          {(product.howToUse ?? product.how_to_use) != null && (product.howToUse ?? product.how_to_use) !== "" && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">How to use</h2>
              <p className="text-gray-600 leading-relaxed max-w-2xl whitespace-pre-line">
                {product.howToUse ?? product.how_to_use}
              </p>
            </section>
          )}

          {(product.skinType ?? product.skin_type) != null && (product.skinType ?? product.skin_type) !== "" && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Skin type</h2>
              <p className="text-gray-600 leading-relaxed max-w-2xl">
                {Array.isArray(product.skinType ?? product.skin_type)
                  ? (product.skinType ?? product.skin_type).join(", ")
                  : (product.skinType ?? product.skin_type)}
              </p>
            </section>
          )}

          {(() => {
            const pt = product.productType ?? product.product_type ?? product.category?.name ?? (product.category && typeof product.category === "object" ? product.category.name : null);
            const ptStr = pt == null ? "" : Array.isArray(pt) ? pt.join(", ") : typeof pt === "string" ? pt : pt?.name ?? "";
            return ptStr.trim() ? (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Product type</h2>
                <p className="text-gray-600 leading-relaxed max-w-2xl">{ptStr}</p>
              </section>
            ) : null;
          })()}

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Feedback</h2>
            {productFeedbacks.length > 0 ? (
              <div className="space-y-4 max-w-2xl">
                {productFeedbacks.map((fb, idx) => {
                  const stars = Math.max(1, Math.min(5, Number(fb?.rating) || 5));
                  const comment = fb?.comment?.trim() || "";
                  return (
                    <div key={fb.id ?? idx} className="bg-white border border-gray-100 rounded-2xl p-5">
                       <div className="flex items-center gap-3 mb-3">
                         {fb.imageUrl ? (
                           <Image
                             src={fb.imageUrl}
                             alt="Reviewer"
                             width={40}
                             height={40}
                             className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                             unoptimized
                           />
                         ) : (
                           <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                             {getInitials(fb.userDisplayName)}
                           </div>
                         )}
                         <div>
                           <p className="font-semibold text-gray-900">{fb.userDisplayName || "Customer"}</p>
                           <p className="text-xs text-gray-500">{fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ""}</p>
                         </div>
                        <div className="ml-auto flex gap-0.5">
                          {[1,2,3,4,5].map(i => <span key={i} className={`text-xl ${i <= stars ? "text-yellow-400" : "text-gray-200"}`}>★</span>)}
                        </div>
                      </div>
                      {comment && <p className="text-gray-600 leading-relaxed">{comment}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic max-w-2xl">No feedback yet for this product. Be the first to share your experience!</p>
            )}
          </section>

          {!product.description?.trim() &&
            !(product.howToUse ?? product.how_to_use)?.toString().trim() &&
            !(product.skinType ?? product.skin_type) &&
            !(product.productType ?? product.product_type ?? product.category?.name) && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Product details</h2>
              <p className="text-gray-600 leading-relaxed max-w-2xl">No additional details available.</p>
            </section>
          )}
        </div>
      </div>

      {/* Recommended with – same brand */}
      {relatedProducts.length > 0 && (
        <section className="max-w-6xl mx-auto mt-16 pt-14 border-t border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Recommended with</h2>
            {brandName && (
              <Link
                href={`/products?search=${encodeURIComponent(brandName)}`}
                className="text-sm font-medium text-[#eb61a2] hover:underline"
              >
                    View All Products
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
             {relatedProducts.map((p) => (
               <div
                 key={p.id}
                 className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-[100]"
               >
                 <div className="relative h-[200px] bg-gray-100">
                   <Image
                     src={getProductImageUrl(p, DefaultImage)}
                     alt={p?.name || "Product"}
                     fill
                     className="object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                     sizes="(max-width: 600px) 50vw, 200px"
                     unoptimized
                     onClick={() => router.push(`/product_details?productId=${p.id}`)}
                   />
                     <button
                       type="button"
                       onClick={(e) => { e.stopPropagation(); handleToggleFavorite(p.id); }}
                       className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 hover:bg-red-50 transition-colors"
                     >
                        <FaHeart className={`text-sm ${favoriteIds.has(Number(p.id)) ? 'text-[#F83E94]' : 'text-[#2F2F2F]'}`} />
                     </button>
                 </div>
                  <div className="flex flex-col flex-1 p-4 gap-1 min-w-0 text-center">
                    <h3 className="text-[1.15rem] font-bold text-gray-800 truncate" title={p.name}>
                      {p.name}
                    </h3>
                      <ProductPrice 
                        price={p.price} 
                        discountedPrice={relatedDiscountedPrices[p.id]}
                        originalClassName="text-sm line-through text-gray-400"
                        discountedClassName="text-sm font-bold text-black"
                        priceClassName="text-sm font-bold text-black mt-1"
                        className="justify-center"
                      />

                    <button
                      type="button"
                      onClick={() => addToCart(p.id, 1)}
                      className="mt-3 w-full bg-[#d13e82] text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#c32c70] transition-colors"
                    >
                      <FaCartPlus className="text-base" /> Add to Cart
                    </button>
                  </div>
               </div>
             ))}
          </div>
        </section>
      )}
    </>
  );
};

// The main page component that sets up the structure and Suspense boundary
const ProductDetailsPage = () => {
  return (
    <>
      <Navbar alwaysVisible={true} />
<main className="pt-[5rem] px-0 pb-16 bg-[#F7F7F7] font-[Poppins,sans-serif]">
         {/* ===== Hero Section ===== */}
         <div className="w-full mb-[1rem] -mt-[4.5rem]">
           <h1 className="mt-[12px] tw-full h-[9rem] flex items-end justify-center  text-4xl font-bold  bg-[#F7F7F7] text-[#EB61A2] pb-[13px] max-[750px]:pr-4 max-[750px]:text-[1.8rem]">
             Product Detail
           </h1>
         </div>

        <div className="px-4 sm:px-6">
          <Suspense fallback={<Loading />}>
            <ProductDetailsContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetailsPage;
