"use client";

import React, { useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import {useRouter,  useSearchParams } from "next/navigation";
import { useState } from "react";
import axiosAuth from "./lib/api/axiosConfig.js";
import Navbar from "../Components/Navbar/Navbar.jsx";
import Footer from "../Components/Footer/Footer.jsx";
import useUserActions from "../Components/Hooks/userUserActions.js";
import useAuthContext from "./lib/Authentication/AuthContext.jsx";
import LoginFirst from "../Components/LoginFirst/LoginFirst.js";
import { FaCartPlus, FaHeart, FaChevronLeft, FaChevronRight, FaChevronDown } from "react-icons/fa";
import { getProductImageUrl } from "./lib/productImage.js";
import { formatPrice } from "./lib/formatPrice.js";

function useScrollAnimation() {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.02, rootMargin: "0px 0px -100px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

function useDragScroll(ref) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = useCallback((e) => {
    if (!ref.current) return;
    isDragging.current = true;
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
    ref.current.style.cursor = "grabbing";
  }, [ref]);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    if (isDragging.current) {
      isDragging.current = false;
      ref.current.style.cursor = "grab";
    }
  }, [ref]);

  const handleMouseUp = useCallback(() => {
    if (!ref.current) return;
    if (isDragging.current) {
      isDragging.current = false;
      ref.current.style.cursor = "grab";
    }
  }, [ref]);

  const handleMouseMove = useCallback((e) => {
    if (!ref.current || !isDragging.current) return;
    e.preventDefault();
    const container = ref.current;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const newScrollLeft = scrollLeft.current - walk;
    container.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));
  }, [ref]);

  return {
    onMouseDown: handleMouseDown,
    onMouseLeave: handleMouseLeave,
    onMouseUp: handleMouseUp,
    onMouseMove: handleMouseMove,
  };
}

export default function Page() {
    const router = useRouter();
      const searchParams = useSearchParams();
    
      const { user } = useAuthContext();
      const { addToCart, addToFavorite } = useUserActions();
      const [products, setProducts] = useState([]);
      const [categories, setCategories] = useState([]);
      const [loading, setLoading] = useState(true);
      const [isClient, setIsClient] = useState(false);
    
      const loginFirst = useMemo(() => new LoginFirst(user, router.push), [user, router.push]);
    
      const scrollToProducts = useCallback(() => {
      const section = document.getElementById("product");
    if (section) {
      const navbarHeight = document.querySelector("nav")?.offsetHeight || 0;

    // 🔥 THIS IS THE KEY LINE - Change this number to control position
      const extraOffset = -120; // Adjust this value!

    // Apply the offset to the scroll calculation
      const y = section.getBoundingClientRect().top + window.scrollY - navbarHeight - extraOffset;

     window.scrollTo({ top: y, behavior: "smooth" });
  }
}, []);

      const testimonialsRef = useRef(null);
      const leftGradientRef = useRef(null);
      const rightGradientRef = useRef(null);
      const dragScrollHandlers = useDragScroll(testimonialsRef);
      const [canScrollLeft, setCanScrollLeft] = useState(true);
      const [canScrollRight, setCanScrollRight] = useState(true);
      const [expandedRec, setExpandedRec] = useState({});

      // Control gradient visibility based on scroll position
      useEffect(() => {
        const container = testimonialsRef.current;
        const leftGradient = leftGradientRef.current;
        const rightGradient = rightGradientRef.current;

        if (!container || !leftGradient || !rightGradient) return;

        const updateGradients = () => {
          const scrollLeft = container.scrollLeft;
          const maxScroll = container.scrollWidth - container.clientWidth;
          const isAtLeft = scrollLeft <= 0;
          const isAtRight = scrollLeft >= maxScroll - 5;

          leftGradient.style.opacity = isAtLeft ? "0" : "1";
          rightGradient.style.opacity = isAtRight ? "0" : "1";

          setCanScrollLeft(!isAtLeft);
          setCanScrollRight(!isAtRight);
        };

        container.addEventListener("scroll", updateGradients);
        updateGradients();

        return () => container.removeEventListener("scroll", updateGradients);
      }, []);
    
      useEffect(() => {
        if (searchParams.get("scroll") === "product") {
          scrollToProducts();
        }
      }, [searchParams, scrollToProducts]);
    
      useEffect(() => {
        setIsClient(true);
      }, []);

      useEffect(() => {
        const fetchCategories = async () => {
          try {
            const res = await axiosAuth.get("/categories/all-categories");
            setCategories(res?.data?.data || []);
          } catch (err) {
            console.error("Error fetching categories:", err);
            setCategories([]);
          }
        };
        fetchCategories();
      }, []);

      useEffect(() => {
        const fetchProducts = async () => {
          setLoading(true);
          try {
            const res = await axiosAuth.get("/products/all");
            setProducts(res?.data?.data || []);
          } catch (err) {
            console.error("Error fetching products:", err);
          } finally {
            setLoading(false);
          }
        };
        fetchProducts();
      }, []); 
    
      const handleFavoriteClick = useCallback(async (productId) => {
        if (!user) {
          const message = loginFirst.messages.loginRequiredFavorite;
          router.push(`/login?redirect=${encodeURIComponent("/")}&message=${encodeURIComponent(message)}`);
          return;
        }
        await addToFavorite(productId);
      }, [user, loginFirst, router, addToFavorite]);
    
      const handleAddToCartClick = useCallback(async (productId) => {
        if (!user) {
          const message = loginFirst.messages.loginRequiredCart;
          router.push(`/login?redirect=${encodeURIComponent("/")}&message=${encodeURIComponent(message)}`);
          return;
        }
        await addToCart(productId, 1);
      }, [user, loginFirst, router, addToCart]);

      const featuredProduct = products[0];
      const overviewProducts = products.slice(0, 3);
      const recommendationProducts = products.slice(0, 7);

      const ImagesInRecommendation = [
        { image: "/assets/ImagesInRecommendation/boss_image.png", name: "Boss Glow", role: "Influencer" },
        { image: "/assets/ImagesInRecommendation/none_sence_image.png", name: "None Sense", role: "Skincare Expert" },
        { image: "/assets/ImagesInRecommendation/ohio_image.png", name: "Ohio Fresh", role: "Beauty Blogger" },
        { image: "/assets/ImagesInRecommendation/obey_iamge.png", name: "Obey Clean", role: "Dermatologist" },
        { image: "/assets/ImagesInRecommendation/bro_jirim_image.png", name: "Bro Jirim", role: "Content Creator" },
        { image: "/assets/ImagesInRecommendation/phol_sophea_image.png", name: "Phol Sophea", role: "Makeup Artist" },
        { image: "/assets/ImagesInRecommendation/profile_image.png", name: "Profile Pro", role: "Influencer" },
      ];
      const aboutCategories = categories.filter((category) => category?.description?.trim()).slice(0, 4);
      const averagePrice = products.length
        ? products.reduce((sum, product) => sum + Number(product?.price || 0), 0) / products.length
        : 0;
      const categoryItems = categories;
      const categoryTextStyles = [
        "font-bold text-[#FF0000] italic",
        "font-extrabold text-[#854DFF]",
        "font-medium text-white",
        "font-bold text-[#DB14CD] uppercase",
      ];
      const stats = [
        { number: `${products.length}+`, label: "Products Available" },
        { number: `${categories.length}`, label: "Categories" },
        { number: formatPrice(averagePrice), label: "Average Price" },
      ];

  return (
    <div className="overflow-x-hidden">
          {isClient && <Navbar alwaysVisible={true} />}
    
          {/* HERO SECTION */}
          <div className="flex flex-col md:flex-row justify-center items-center w-full min-h-screen bg-[#EE90B9] overflow-hidden relative px-4 sm:px-8 md:px-16 py-0 max-[767px]:gap-0 md:gap-8">
            <div className="flex flex-col justify-center w-full md:w-1/2 text-center md:text-left text-[#1f2937] z-[2] max-[767px]:mt-[10vh]">
              <p className="text-[57px] font-bold text-[#3C3C3C] max-[992px]:text-[40px] max-[600px]:text-[33px]">WELCOME TO SKIN.ME</p>
              <p className="tracking-[-0.05em] text-[44px] font-semibold text-white mb-2 max-[992px]:text-[28px] max-[600px]:text-[22px]">Most Essential Skin Care Product</p>
              <p className="opacity-[0.8] text-[20px] text-[#4c4c4c] mb-4 max-[992px]:text-[16px] max-[600px]:text-sm">Give you the best skincare | product is our mission.</p>
              <div>
                <button
                  onClick={scrollToProducts}
                  className="opacity-[1] text-white text-[30px] font-semibold px-[50px] py-3.5 bg-[#FA4497] rounded-[7px] border-none cursor-pointer transition-all duration-200 hover:bg-[#c8538a] active:bg-[#e33486] max-[992px]:text-lg  max-[992px]:px-10 max-[992px]:py-3 max-[600px]:text-lg max-[600px]:px-[30px] max-[600px]:py-2.5"
                >
                  Shop Now
                </button>
              </div>
            </div>

            <div className="w-[20rem] h-[25rem] md:w-1/2 md:h-[50rem] md:mt-4 z-[4] rounded-[30px] overflow-hidden flex items-center justify-center">
             {featuredProduct && (
               <Image
                sizes="(max-width: 768px) 20rem, 50vw"
                priority
                src={getProductImageUrl(featuredProduct)}
                alt={featuredProduct?.name || "skin product"}
                width={640}
                height={800}
                quality={85}
                className="max-w-full max-h-full object-contain z-[5] rounded-[10px] mt-8 max-[767px]:-mt-8"
                fetchPriority="high"
                unoptimized
              />
             )}
            </div>
          </div>
    
      {/* OVERVIEW SECTION */}
      {(() => {
        const [noAnimation, setNoAnimation] = useState(false);
        const [hasAnimated, setHasAnimated] = useState(false);
        useEffect(() => {
          const handlePageShow = (event) => {
            if (event.persisted) {
              setNoAnimation(true);
              setHasAnimated(true);
            }
          };
          window.addEventListener('pageshow', handlePageShow);
          return () => window.removeEventListener('pageshow', handlePageShow);
        }, []);
        const [overviewRef, overviewVisible] = useScrollAnimation();
        const finalVisible = overviewVisible || hasAnimated;
        return (
        <div ref={overviewRef} className={`py-[4rem] max-[1350px]:mb-[-0.75rem] max-[1350px]:mt-[0.75rem] max-[1300px]:mb-[-7.35rem] max-[1300px]:mt-[2.35rem] max-[1300px]:mb-[-5.35rem] max-[1100px]:mb-[-12.5rem] max-[990px]:mb-[-22.5rem]  max-[990px]:mt-[-2.5rem]    relative max-[1390px]:[transform:scale(0.95)] max-[1300px]:[transform:scale(0.85)] max-[1250px]:[transform:scale(0.83)] max-[1200px]:[transform:scale(0.80)] max-[1150px]:[transform:scale(0.75)] max-[1100px]:[transform:scale(0.70)] max-[660px]:[transform:scale(0.65)] origin-top ${noAnimation ? '' : 'transition-all duration-1000 ease-out'} ${finalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-32'}`}>
        <div className="flex flex-row items-center justify-center relative gap-[5rem] max-[990px]:mt-16 max-[990px]:flex-col max-[990px]:items-center max-[990px]:gap-[2rem]">
          <div className="flex flex-col justify-center items-start w-[35rem] mx-0 ml-4 z-[5] flex-shrink-0 max-[990px]:items-center self-center mt-[1rem]">
            <div className="text-[#eb61a1] text-[50px] font-bold font-[Arial,Helvetica,sans-serif] text-left w-full max-[990px]:text-center">
              LET'S HAVE A LOOK
            </div>
            <div className="mb-[1rem] text-black text-[25px] font-medium font-[Arial,Helvetica,sans-serif] text-left w-full max-[1390px]:mb-[0.75rem] max-[1300px]:mb-[0.75rem] max-[1250px]:mb-[0.5rem] max-[1200px]:mb-[0.5rem] max-[1150px]:mb-[0.5rem]  max-[660px]:mb-[1rem] max-[990px]:text-center">
              This is the overview about our products that you can spend a few minutes to see how they look.
            </div>
            <div className="flex flex-row gap-[2rem]">
              <div className="flex flex-row gap-[2rem] flex-shrink-0 max-[990px]:justify-center max-[990px]:items-center">
                {overviewProducts.slice(0, 2).map((product) => (
                  <Image
                    key={product.id}
                    src={getProductImageUrl(product)}
                    alt={product?.name || "Product overview"}
                    width={352}
                    height={352}
                    className="w-[18rem] h-[18rem] rounded-[10px] flex-shrink-0 object-cover"
                    unoptimized
                  />
                ))}
              </div>
            </div>
          </div>
          {overviewProducts[2] && (
            <div className="mt-[8rem] w-[38rem] h-[38rem] flex-shrink-0 max-[1390px]:mt-[7rem] max-[1300px]:mt-[6rem] max-[1250px]:mt-[5rem] max-[1200px]:mt-[4.5rem] max-[1150px]:mt-[4rem] max-[1100px]:mt-[3.5rem] max-[660px]:mt-[3rem] max-[990px]:ml-[1rem] max-[660px]:mb-[-5rem]"  >
              <Image
                src={getProductImageUrl(overviewProducts[2])}
                alt={overviewProducts[2]?.name || "Product overview"}
                width={560}
                height={480}
                className="w-full h-full object-cover rounded-[10px] block -mt-[3.3rem]"
                unoptimized
              />
            </div>
          )}
        </div>
      </div>
        );
      })()}

      {/* LOGO MOVING SECTION */}
<div className="bg-[#0A3D3F] py-16 max-[1000px]:py-12 max-[600px]:py-10 overflow-hidden relative z-[1]">
  <div className="flex w-max animate-marquee">

    {[0, 1].map((setIndex) => (
      <div key={setIndex} className="flex whitespace-nowrap">
        {categoryItems.map((category, index) => (
          <span
            key={`${setIndex}-${category.id ?? category.name}`}
            className={`text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl mx-12 ${categoryTextStyles[index % categoryTextStyles.length]}`}
          >
            {category.name}
          </span>
        ))}
      </div>
    ))}

  </div>
</div>

          {/* PRODUCTS SECTION  */}
          {(() => {
            const [noAnimation, setNoAnimation] = useState(false);
            const [hasAnimated, setHasAnimated] = useState(false);
            useEffect(() => {
              const handlePageShow = (event) => {
                if (event.persisted) {
                  setNoAnimation(true);
                  setHasAnimated(true);
                }
              };
              window.addEventListener('pageshow', handlePageShow);
              return () => window.removeEventListener('pageshow', handlePageShow);
            }, []);
            const [productRef, productVisible] = useScrollAnimation();
            const finalVisible = productVisible || hasAnimated;
            return (
            <section ref={productRef} id="product" className={`py-20 px-8 bg-[#CCF6F2] text-center max-[1180px]:mt-[-3rem] ${noAnimation ? '' : 'transition-all duration-1000 ease-out delay-200'} ${finalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-32'}`}>
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-12 uppercase">
                  <h2 className="text-[3rem] text-[#eb61a2] font-bold max-[1000px]:text-[2.5rem] max-[600px]:text-[28px]">OUR PRODUCTS</h2>
                  <button
                    className="bg-[#eb61a2] text-white border-none px-[3rem] py-3 rounded-[0.5rem] text-[1.5rem] cursor-pointer transition-[0.1s] ease hover:bg-[#c8538a] max-[1000px]:text-[1.25rem] max-[600px]:text-sm"
                    onClick={() => router.push("/products")}
                  >
                    View All
                  </button>
                </div>

              {loading ? (
                <p className="text-center text-gray-500 text-lg mt-20">Loading products...</p>
              ) : products.length === 0 ? (
                <p className="text-center text-gray-500 text-lg mt-20">No products found.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {products.slice(0, 10).map((p) => {
                    const brand = typeof p?.brand === "string" ? p.brand : p?.brand?.name ?? "";
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
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-[#e53e3e] hover:bg-red-50 transition-colors"
                            onClick={() => handleFavoriteClick(p.id)}
                          >
                            <FaHeart className="text-sm" />
                          </button>
                        </div>
                        <div className="flex flex-col flex-1 p-4 gap-1 min-w-0">
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
                          <p className="text-sm font-bold text-black mt-1">
                            {formatPrice(p?.price)}
                          </p>
                          <button
                            type="button"
                            className="mt-3 w-full bg-[#d13e82] text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#c32c70] transition-colors"
                            onClick={() => handleAddToCartClick(p.id)}
                          >
                            <FaCartPlus className="text-base" /> Add to Cart
                          </button>
</div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          </section>
            );
          })()}
          {/* CUSTOMER STORIES RECOMMENDATION SECTION */}
          {(() => {
            const [noAnimation, setNoAnimation] = useState(false);
            const [hasAnimated, setHasAnimated] = useState(false);
            useEffect(() => {
              const handlePageShow = (event) => {
                if (event.persisted) {
                  setNoAnimation(true);
                  setHasAnimated(true);
                }
              };
              window.addEventListener('pageshow', handlePageShow);
              return () => window.removeEventListener('pageshow', handlePageShow);
            }, []);
            const [recommendRef, recommendVisible] = useScrollAnimation();
            const finalVisible = recommendVisible || hasAnimated;
            return (
          <div ref={recommendRef} className={`bg-white pt-8 pb-20 px-8 ${noAnimation ? '' : 'transition-all duration-1000 ease-out delay-300'} ${finalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-32'}`}>
            <div className="max-w-7xl mx-auto">

              {/* Header */}
              <div className="text-center mb-16">
                <h2 className="text-[4rem] font-bold text-[#3C3C3C] mb-4 max-[1000px]:text-[3rem] max-[600px]:text-[2.5rem]">
                  RECOMMENDATIONS
                </h2>
                <p className="text-[#000] text-[1.5rem] font-sans whitespace-pre-line text-left leading-relaxed max-[1000px]:text-[1.25rem] max-[600px]:text-[1.125rem]">
                  Discover customer-loved skincare essentials for healthy, glowing skin — curated for every skin type and daily routine.
                </p>
              </div>

              {/* Featured Large Testimonial */}
             

              {/* 3-column smaller testimonials with click scroll */}
              <div className="relative">
                {/* Left scroll button with shadow */}
                <button
                  onClick={() => {
                    const container = document.getElementById('testimonials-container');
                    const cards = container?.querySelectorAll('.testimonial-card');
                    if (container && cards?.length > 0) {
                      const gap = 24;
                      const cardWidth = cards[0].offsetWidth;
                      const scrollAmount = cardWidth + gap;
                      const newScrollLeft = container.scrollLeft - scrollAmount;
                      container.scrollTo({ left: Math.max(0, newScrollLeft), behavior: 'smooth' });
                    }
                  }}
                  disabled={!canScrollLeft}
                  className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.15)] rounded-full w-12 h-12 flex items-center justify-center text-[#eb61a2] hover:bg-[#eb61a2] hover:text-white transition-all duration-300 -ml-6 max-[600px]:-ml-2 ${!canScrollLeft ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <FaChevronLeft size={20} />
                </button>

                {/* Right scroll button with shadow */}
                <button
                  onClick={() => {
                    const container = document.getElementById('testimonials-container');
                    const cards = container?.querySelectorAll('.testimonial-card');
                    if (container && cards?.length > 0) {
                      const gap = 24;
                      const cardWidth = cards[0].offsetWidth;
                      const scrollAmount = cardWidth + gap;
                      const maxScroll = container.scrollWidth - container.clientWidth;
                      const newScrollLeft = container.scrollLeft + scrollAmount;
                      container.scrollTo({ left: Math.min(maxScroll, newScrollLeft), behavior: 'smooth' });
                    }
                  }}
                  disabled={!canScrollRight}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.15)] rounded-full w-12 h-12 flex items-center justify-center text-[#eb61a2] hover:bg-[#eb61a2] hover:text-white transition-all duration-300 -mr-6 max-[600px]:-mr-2 ${!canScrollRight ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <FaChevronRight size={20} />
                </button>

                {/* Gradient shadows on both sides */}
                <div ref={leftGradientRef} className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-white to-transparent z-5 pointer-events-none transition-opacity duration-300"></div>
                <div ref={rightGradientRef} className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white to-transparent z-5 pointer-events-none transition-opacity duration-300"></div>

                <div
                  ref={testimonialsRef}
                  id="testimonials-container"
                  className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide cursor-grab select-none"
                  {...dragScrollHandlers}
                >
                   {recommendationProducts.map((product, idx) => {
                     const brand = typeof product?.brand === "string" ? product.brand : product?.brand?.name ?? "SKIN.ME";
                     const stars = Math.max(3, Math.min(5, Math.ceil(Number(product?.price || 0) / Math.max(averagePrice || 1, 1) * 4)));
                     const text = product?.description?.trim() || product?.name || "Recommended skincare product";
                     const recItem = ImagesInRecommendation[idx] || {};
                     return (
                     <div
                       key={product.id ?? idx}
                       className="testimonial-card bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.08)] border border-[#ffd6ec] flex flex-col gap-4 w-[350px] max-[1000px]:w-[300px] max-[600px]:w-[280px] flex-shrink-0"
                     >
                       <div className="flex items-center gap-3">
                         <Image
                           src={recItem.image || getProductImageUrl(product)}
                           alt={recItem.name || product?.name || "Recommended product"}
                           width={48}
                           height={48}
                           className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                           unoptimized
                         />
                         <div>
                           <p className="font-bold text-[#3C3C3C] text-sm">{recItem.name || product?.name || "Product"}</p>
                           <p className="text-[#aaa] text-xs">{recItem.role || "Skincare Expert"}</p>
                         </div>
                       </div>
                       <div className="bg-[#EDEDED] rounded-xl p-4 mt-2 flex flex-col justify-between flex-grow">
                         <div>
                           <div className="flex gap-2 mb-2">
                             {[1,2,3,4,5].map(i => (
                               <span key={i} className={`text-4xl ${i <= stars ? "text-yellow-400" : "text-transparent [-webkit-text-stroke:2px_#facc15]"}`}>&#9733;</span>
                             ))}
                           </div>
                            <p className="text-[#3C3C3C] text-sm font-medium mb-1">
                              On {product?.name || "Product"}
                            </p>
                            <p className={`text-[#555] text-sm leading-relaxed transition-all duration-300 ${expandedRec[idx] ? '' : 'line-clamp-3'}`}>
                              {text}
                            </p>
                            {text.length > 80 && (
                              <button
                                onClick={() => setExpandedRec(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                className="flex items-center gap-1 text-xs font-semibold text-[#eb61a2] mt-1 hover:underline"
                              >
                                {expandedRec[idx] ? 'Show less' : 'Read more'}
                                <FaChevronDown className={`transition-transform duration-300 ${expandedRec[idx] ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                          </div>
                          <div className="flex justify-end pt-4">
                            <p className="text-xs text-[#999]">{formatPrice(product?.price)}</p>
                          </div>
                       </div>
                     </div>
 );
                    })}
                 </div>
               </div>

              {/* Bottom stats bar */}
              <div className="mt-14 grid grid-cols-3 gap-4 text-center max-[1000px]:mt-10 max-[600px]:mt-8">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl py-6 px-4 border border-[#ffd6ec] shadow-sm max-[1000px]:py-4 max-[600px]:py-3">
                    <p className="text-3xl font-bold text-black mb-1 max-[1000px]:text-2xl max-[600px]:text-xl">{stat.number}</p>
                    <p className="text-sm text-[#888] font-medium max-[1000px]:text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
            );
          })()}

          {/* ABOUT US SECTION */}
          {(() => {
            const [noAnimation, setNoAnimation] = useState(false);
            const [hasAnimated, setHasAnimated] = useState(false);
            useEffect(() => {
              const handlePageShow = (event) => {
                if (event.persisted) {
                  setNoAnimation(true);
                  setHasAnimated(true);
                }
              };
              window.addEventListener('pageshow', handlePageShow);
              return () => window.removeEventListener('pageshow', handlePageShow);
            }, []);
            const [aboutRef, aboutVisible] = useScrollAnimation();
            const finalVisible = aboutVisible || hasAnimated;
            return (
          <div ref={aboutRef} id="aboutus" className={`pt-8 pb-20 px-8 text-center ${noAnimation ? '' : 'transition-all duration-1000 ease-out delay-300'} ${finalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-32'}`}>
            <div className="max-w-7xl mx-auto">
              <p className="text-[4rem] font-bold text-[#000] mb-6 max-[1000px]:text-[3rem] max-[600px]:text-[2.5rem]">ABOUT US</p>
              <div className="text-[#000] text-[1.5rem] font-sans text-left leading-relaxed w-full max-[1000px]:text-[1.25rem] max-[600px]:text-[1.125rem]">
                {aboutCategories.length > 0 ? (
                  aboutCategories.map((category) => (
                    <p key={category.id} className="mb-2">
                      <span className="font-bold">{category.name}</span>
                      {category.description ? `: ${category.description}` : ""}
                    </p>
                  ))
                ) : (
                  <p className="mb-2 text-gray-500">No category descriptions available.</p>
                )}
              </div>            </div>
            <div className="grid grid-cols-4 gap-[2rem] mt-8 max-w-7xl mx-auto justify-center max-[992px]:grid-cols-2 max-[600px]:gap-[1rem]">
              {products.slice(0, 4).map((product) => (
                <Image
                  key={product.id}
                  src={getProductImageUrl(product)}
                  alt={product?.name || "Product"}
                  width={280}
                  height={280}
                  className="w-full h-auto rounded-[10px] object-cover"
                  unoptimized
                />
              ))}
            </div>          </div>
            );
          })()}
          <Footer />
    </div>
  );
}
