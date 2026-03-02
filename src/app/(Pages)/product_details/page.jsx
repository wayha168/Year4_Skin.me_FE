"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import axiosAuth from "../../../app/lib/api/axiosConfig";

import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import Loading from "../../../Components/Loading/Loading";
import useUserActions from "../../../Components/Hooks/userUserActions";
import { FaCartPlus, FaHeart } from "react-icons/fa";
import { getProductImageUrl, getProductImageUrlFromItem } from "../../../app/lib/productImage";
import { formatPrice } from "../../../app/lib/formatPrice";

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
  const { addToCart, addToFavorite } = useUserActions();

  const handleZoomMove = (clientX, clientY) => {
    if (!galleryRef.current) return;
    const rect = galleryRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setZoom((z) => ({ ...z, show: false }));
      return;
    }
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;
    setZoom({ show: true, x: percentX, y: percentY, lensX: x, lensY: y });
  };

  const handleZoomEnd = () => setZoom((z) => ({ ...z, show: false }));

  const brandName = product ? (typeof product.brand === "string" ? product.brand : product.brand?.name ?? "") : "";

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
        const response = await axiosAuth.get("/products/all");
        const allProducts = response.data?.data || response.data || [];
        const productData = allProducts.find((p) => p.id === Number(productId));

        if (productData) {
          setProduct(productData);
          fetchRelatedProductsByBrand(productData, productData.id);
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
        const response = await axiosAuth.get("/products/all");
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
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-[#eb61a2] transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Gallery with hover/touch zoom */}
          <div className="space-y-4">
            <div
              ref={galleryRef}
              className="relative aspect-square w-full max-w-lg mx-auto rounded-2xl cursor-zoom-in"
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
              <div className="absolute inset-0 bg-gray-50 rounded-2xl overflow-hidden">
                <Image
                  src={mainImageSrc}
                  alt={product.images?.[selectedImageIndex]?.fileName || product.images?.[0]?.fileName || product.name}
                  fill
                  className="object-cover pointer-events-none select-none"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                  priority
                  draggable={false}
                />
              </div>
              {/* Zoom lens – follows cursor/hold, shows 2.5x zoom (like SKIN1004) */}
              {zoom.show && (
                <div
                  className="absolute pointer-events-none rounded-full border-2 border-white shadow-xl bg-no-repeat z-10"
                  style={{
                    width: 140,
                    height: 140,
                    left: zoom.lensX - 70,
                    top: zoom.lensY - 70,
                    backgroundImage: `url(${mainImageSrc})`,
                    backgroundSize: "250%",
                    backgroundPosition: `${zoom.x}% ${zoom.y}%`,
                  }}
                />
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
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">{brandName}</p>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-3">
              {product.name}
            </h1>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {product.description?.split(".")[0]?.trim() || product.description || "Skincare product."}
            </p>

            {/* Price */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-0.5">Regular price</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</p>
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
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-gray-700">Quantity</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
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
                onClick={() => addToFavorite(product.id)}
                className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-[#eb61a2] hover:text-[#eb61a2] transition-colors"
                aria-label="Add to favorites"
              >
                <FaHeart className="text-lg" />
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
                View all from {brandName}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div
                  className="relative aspect-square bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/product_details?productId=${p.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/product_details?productId=${p.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <Image
                    src={getProductImageUrl(p, DefaultImage)}
                    alt={p?.name || "Product"}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, 20vw"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); addToFavorite(p.id); }}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-gray-600 hover:text-[#eb61a2] transition-colors shadow-sm"
                    aria-label="Add to favorites"
                  >
                    <FaHeart className="text-sm" />
                  </button>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate mb-1" title={p?.name}>
                    {p?.name || "No Name"}
                  </h3>
                  <p className="text-sm font-semibold text-[#eb61a2] mb-3">{formatPrice(p?.price)}</p>
                  <button
                    type="button"
                    onClick={() => addToCart(p.id, 1)}
                    className="mt-auto w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#eb61a2] hover:bg-[#d13e82] transition-colors"
                  >
                    Add to Bag
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
      <main className="pt-24 sm:pt-28 pb-20 bg-white font-[Poppins,sans-serif] px-4 sm:px-6">
        <Suspense fallback={<Loading />}>
          <ProductDetailsContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetailsPage;
