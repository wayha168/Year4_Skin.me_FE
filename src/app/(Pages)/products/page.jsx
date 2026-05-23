"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import axiosAuth from "../../../app/lib/api/axiosConfig";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";

import { FaCartPlus, FaHeart } from "react-icons/fa";
import Loading from "../../../Components/Loading/Loading";
import useUserActions from "../../../Components/Hooks/userUserActions";
import { getProductImageUrl } from "../../../app/lib/productImage";
import { formatPrice } from "../../../app/lib/formatPrice";
import ProductPrice from "../../../Components/ProductPrice/ProductPrice";

const ThirdImage = "/assets/third_image.png";

const getBrand = (product) => {
  if (typeof product?.brand === "string") return product.brand;
  return (
    product?.brand?.name ??
    product?.brandName ??
    product?.brand_name ??
    product?.brand?.brandName ??
    product?.brand?.brand_name ??
    ""
  );
};

const getCategoryName = (product) => {
  if (typeof product?.category === "string") return product.category;
  return product?.category?.name ?? product?.categoryName ?? "Uncategorized";
};

const getResponseItems = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

const Products = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("all");
  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [discountedPrices, setDiscountedPrices] = useState({});
  const [promoModal, setPromoModal] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const urlFilters = useMemo(() => {
    const readList = (key) =>
      searchParams
        .get(key)
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean) || [];

    const brands = readList("brand");
    const rating = readList("rating");
    const ageRange = readList("ageRange");
    const skinType = readList("skinType");
    return { brands, rating, ageRange, skinType };
  }, []);

  useEffect(() => {
    setSearchTerm(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const updateSidebarPosition = () => {
      setSidebarCompact(window.scrollY > 72);
    };

    updateSidebarPosition();
    window.addEventListener("scroll", updateSidebarPosition, { passive: true });
    return () => window.removeEventListener("scroll", updateSidebarPosition);
  }, []);

  const { addToCart, addToFavorite } = useUserActions();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axiosAuth.get("/products/all");
        setProducts(getResponseItems(res?.data?.data));
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch discounted prices for all products (same pattern as bag page)
  useEffect(() => {
    const fetchDiscounts = async () => {
      if (!products.length) {
        setDiscountedPrices({});
        return;
      }

      const productIds = [...new Set(products.map(p => p.id).filter(Boolean))];

      const promises = productIds.map(async (pid) => {
        try {
          const res = await axiosAuth.get(`/promotions/product/${pid}/discounted-price`);
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
      const map = {};
      results.forEach(([id, val]) => {
        if (val != null) map[id] = val;
      });
      setDiscountedPrices(map);
    };

    fetchDiscounts();
  }, [products]);

  const handleAddToCart = async (productId) => {
    await addToCart(productId, 1);
  };

  const handleFavorite = async (productId) => {
    await addToFavorite(productId);
  };

  // Open promotion modal (same as homepage)
  const openPromotionModal = useCallback(async (product) => {
    setPromoLoading(true);
    try {
      const res = await axiosAuth.get(`/promotions/product/${product.id}`);
      const promotion = res?.data?.data || null;
      setPromoModal({ product, promotion });
    } catch {
      setPromoModal({ product, promotion: null });
    } finally {
      setPromoLoading(false);
    }
  }, []);

  const getGroupedAndFilteredProducts = () => {
    let filtered = [...products];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (p) => p?.name?.toLowerCase().includes(term) || getBrand(p)?.toLowerCase().includes(term),
      );
    }

    const getPriceRating = (() => {
      const prices = products.map((p) => Number(p?.price) || 0).sort((a, b) => a - b);
      if (prices.length === 0) return () => 3;
      const p40 = prices[Math.floor(prices.length * 0.4)];
      const p80 = prices[Math.floor(prices.length * 0.8)];
      return (price) => {
        if (price >= p80) return 5;
        if (price >= p40) return 4;
        return 3;
      };
    })();

    const ageRangeCycle = [
      "10 - 20 years",
      "20 - 30 years",
      "20 - 30 years",
      "20 - 30 years",
      "20 - 30 years",
      "30 - 40 years",
      "30 - 40 years",
      "30 - 40 years",
      "40 - 50 years",
      "40 - 50 years",
    ];

    const skinTypeCycle = ["Oily", "Dry", "Combination", "Sensitive", "Acne-prone"];

    const { brands, rating, ageRange, skinType } = urlFilters;

    if (brands.length > 0 || rating.length > 0 || ageRange.length > 0 || skinType.length > 0) {
      filtered = filtered.filter((p, idx) => {
        const productAgeRange = ageRangeCycle[idx % ageRangeCycle.length];
        const productSkinType = skinTypeCycle[idx % skinTypeCycle.length];
        const productRating = getPriceRating(Number(p?.price) || 0);
        const brandName = (getBrand(p) || "").trim().toLowerCase();

        const matchesBrand = brands.some((b) => b.trim().toLowerCase() === brandName);
        const matchesRating = rating.includes(String(productRating));
        const matchesAge = ageRange.includes(productAgeRange);
        const matchesSkin = skinType.includes(productSkinType);

        const activeMatches = [];
        if (brands.length > 0) activeMatches.push(matchesBrand);
        if (rating.length > 0) activeMatches.push(matchesRating);
        if (ageRange.length > 0) activeMatches.push(matchesAge);
        if (skinType.length > 0) activeMatches.push(matchesSkin);

        return activeMatches.some((m) => m);
      });
    }

    if (sortBy === "price-high") {
      filtered.sort((a, b) => (Number(b?.price) || 0) - (Number(a?.price) || 0));
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => (Number(a?.price) || 0) - (Number(b?.price) || 0));
    } else if (sortBy === "new") {
      filtered.sort((a, b) => (b?.id || 0) - (a?.id || 0));
    } else if (sortBy === "recommended") {
      filtered.sort((a, b) => (b?.name?.length || 0) - (a?.name?.length || 0));
    }

    if (sortBy === "price-high" || sortBy === "price-low" || sortBy === "recommended" || sortBy === "new") {
      const categoryLabels = {
        "price-high": "Price High to Low",
        "price-low": "Price Low to High",
        recommended: "Recommended",
        new: "What's New",
      };
      return { [categoryLabels[sortBy]]: filtered };
    }

    return filtered.reduce((acc, product) => {
      const categoryName = getCategoryName(product);
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(product);
      return acc;
    }, {});
  };

  const groupedProducts = getGroupedAndFilteredProducts();

  const sortedCategories = Object.entries(groupedProducts).sort((a, b) => b[1].length - a[1].length);

  const hasProducts = sortedCategories.length > 0;

  return (
    <>
      <Navbar alwaysVisible={true} />
      <main className="min-h-screen pt-[8rem] px-0 pb-16 bg-[#F7F7F7] font-[Poppins,sans-serif]">
        {/* ===== Hero Section ===== */}
        <div className="w-full -mt-[4rem]">
          <h1 className="w-full h-[9rem] flex items-end justify-center max-[750px]:justify-end text-4xl font-bold  bg-[#F7F7F7] text-[#EB61A2] pb-[19px] max-[750px]:pr-4 max-[750px]:text-[1.8rem] border-b border-[#f0f0f0]">
            Our Products
          </h1>
        </div>

        {/* ===== Main Content with Fixed Left Sidebar ===== */}
        <div className="flex">
          {/* Fixed Left Sidebar */}
          <aside
            className={`fixed left-0 w-[260px] bg-white/95 backdrop-blur border-r border-gray-200 transition-[top,height] duration-200 ease-out ${
              sidebarCompact ? "top-12 h-[calc(100vh-3rem)]" : "top-[8rem] h-[calc(100vh-8rem)]"
            }`}
          >
            <div className="flex h-full flex-col px-7">
              <div className="flex items-center justify-between py-6 border-b border-gray-200">
                <h3 className="text-[1.15rem] font-bold text-gray-900">Refine</h3>
                <button
                  type="button"
                  onClick={() => setSortBy("all")}
                  className="text-xs text-gray-500 underline underline-offset-2 hover:text-[#d13e82]"
                >
                  Clear all
                </button>
              </div>
              <div className="flex items-center justify-between py-5">
                <p className="text-sm font-bold text-gray-900">Sort By</p>
                <span className="text-lg leading-none text-gray-900">-</span>
              </div>
              <div className="flex-1 overflow-y-auto pb-4 [scrollbar-width:thin] [scrollbar-color:#d1d5db_transparent]">
                {[
                  { value: "all", label: "All Products" },
                  { value: "recommended", label: "Recommended" },
                  { value: "new", label: "What's New" },
                  { value: "price-high", label: "Price High to Low" },
                  { value: "price-low", label: "Price Low to High" },
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`mb-3 flex cursor-pointer items-center gap-2.5 text-sm transition-colors ${
                      sortBy === option.value
                        ? "text-[#d13e82] font-semibold"
                        : "text-gray-700 hover:text-[#d13e82]"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 flex-shrink-0 border ${
                        sortBy === option.value ? "border-[#d13e82] bg-[#d13e82]" : "border-gray-300 bg-white"
                      }`}
                    />
                    <span className="leading-snug">{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Products Area */}
          <div className="flex-1 ml-[260px] px-8">
            {loading ? (
              <Loading />
            ) : !hasProducts ? (
              <p className="text-center text-gray-500 text-lg mt-20">No products found.</p>
            ) : (
              <div className="mx-auto max-w-[1120px] space-y-16 pt-10">
                {sortedCategories.map(([categoryName, productsInCategory]) => (
                  <section key={categoryName}>
                    <div className="mb-9 flex items-center gap-4 text-gray-900">
                      <h2 className="text-lg font-bold">{categoryName}</h2>
                      <span className="text-sm text-gray-400">|</span>
                      <p className="text-sm">
                        <span className="font-bold">{productsInCategory.length}</span> items
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {productsInCategory.map((p) => {
                        const brand = getBrand(p);
                        const desc = p?.description?.trim() || "No description";
                        return (
                          <div
                            key={p.id}
                            className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-[100]"
                          >
                            <div className="relative h-[200px] bg-gray-100">
                              <Image
                                src={getProductImageUrl(p)}
                                alt={p?.name || "Product"}
                                fill
                                className="object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                                sizes="(max-width: 600px) 50vw, 200px"
                                unoptimized
                                onClick={() => router.push(`/product_details?productId=${p.id}`)}
                              />

                              {/* PROMO badge - same as homepage */}
                              {discountedPrices[p?.id] != null && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPromotionModal(p);
                                  }}
                                  className="absolute top-2 left-2 bg-[#eb61a2] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow hover:bg-[#c8538a] active:scale-95 transition-all flex items-center gap-1 z-10"
                                  title="View promotion details"
                                >
                                  PROMO
                                </button>
                              )}

                              <button
                                type="button"
                                className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-[#e53e3e] hover:bg-red-50 transition-colors"
                                onClick={() => handleFavorite(p.id)}
                              >
                                <FaHeart className="text-sm" />
                              </button>
                            </div>
                            <div className="flex flex-col flex-1 p-4 gap-1 min-w-0 text-left">
                              {brand && (
                                <span className="opacity-70 text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                                  {brand}
                                </span>
                              )}
                              <h3 className="text-[1.15rem] font-bold text-gray-800 truncate" title={p?.name}>
                                {p?.name || "No Name"}
                              </h3>
                              <p className="text-xs text-gray-500 truncate opacity-80" title={desc}>
                                {desc}
                              </p>
                              <ProductPrice
                                price={p?.price}
                                discountedPrice={discountedPrices[p?.id]}
                                className="mt-1"
                              />
                              <button
                                type="button"
                                className="mt-3 w-full bg-[#d13e82] text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#c32c70] transition-colors"
                                onClick={() => handleAddToCart(p.id)}
                              >
                                <FaCartPlus className="text-base" /> Add to Cart
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* PROMOTION MODAL - same as homepage */}
      {promoModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPromoModal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#eb61a2] text-white px-6 py-4 flex items-center justify-between">
              <div className="font-bold text-lg">Special Promotion</div>
              <button
                onClick={() => setPromoModal(null)}
                className="text-white/90 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {promoLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-[#eb61a2] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : promoModal.promotion ? (
                <>
                  <div className="flex gap-4 items-start">
                    <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100">
                      <Image
                        src={getProductImageUrl(promoModal.product)}
                        alt={promoModal.product?.name}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xl text-gray-900 leading-tight">
                        {promoModal.product?.name}
                      </div>
                      <div className="text-[#eb61a2] font-extrabold text-4xl mt-1">
                        {typeof promoModal.promotion?.discountPercentage === 'number'
                          ? promoModal.promotion.discountPercentage
                          : '?'}% OFF
                      </div>
                    </div>
                  </div>

                  {promoModal.promotion.description && (
                    <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                      {promoModal.promotion.description}
                    </p>
                  )}

                  <div className="mt-4 text-xs text-gray-500">
                    {promoModal.promotion.startDate || promoModal.promotion.start_date ? (
                      <>Valid from <span className="font-medium text-gray-700">{new Date(promoModal.promotion.startDate || promoModal.promotion.start_date).toLocaleDateString()}</span></>
                    ) : null}
                    {(promoModal.promotion.endDate || promoModal.promotion.end_date) && (
                      <> until <span className="font-medium text-gray-700">{new Date(promoModal.promotion.endDate || promoModal.promotion.end_date).toLocaleDateString()}</span></>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-lg font-semibold text-[#eb61a2]">Limited-time offer</p>
                  <p className="text-sm text-gray-500 mt-1">Special discount is currently active on this product.</p>
                </div>
              )}
            </div>

            <div className="border-t p-4 flex gap-3">
              <button
                onClick={() => setPromoModal(null)}
                className="flex-1 py-3 rounded-2xl border text-gray-700 hover:bg-gray-50 font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const pid = promoModal.product?.id;
                  setPromoModal(null);
                  router.push(`/product_details?productId=${pid}`);
                }}
                className="flex-1 py-3 rounded-2xl bg-[#eb61a2] text-white font-semibold hover:bg-[#c8538a] active:scale-[0.985] transition"
              >
                View Product
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Products;
