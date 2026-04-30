"use client";

import React, { useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import {useRouter,  useSearchParams } from "next/navigation";
import { useState } from "react";
import axios from "./lib/api/axiosConfig.js";
import Navbar from "../Components/Navbar/Navbar.jsx";
import Footer from "../Components/Footer/Footer.jsx";
import useUserActions from "../Components/Hooks/userUserActions.js";
import useAuthContext from "./lib/Authentication/AuthContext.jsx";
import LoginFirst from "../Components/LoginFirst/LoginFirst.js";
import { FaCartPlus, FaHeart, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { getProductImageUrl } from "./lib/productImage.js";
import { formatPrice } from "./lib/formatPrice.js";

function useDragScroll(ref) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const momentumAnimation = useRef(null);

  const stopMomentum = useCallback(() => {
    if (momentumAnimation.current) {
      cancelAnimationFrame(momentumAnimation.current);
      momentumAnimation.current = null;
    }
  }, []);

  const applyMomentum = useCallback(() => {
    if (!ref.current) return;

    const container = ref.current;
    const friction = 0.95;
    const minVelocity = 0.5;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const currentScroll = container.scrollLeft;

    if (currentScroll <= 0 || currentScroll >= maxScroll) {
      momentumAnimation.current = null;
      return;
    }

    if (Math.abs(velocity.current) > minVelocity) {
      container.scrollLeft += velocity.current;
      velocity.current *= friction;
      momentumAnimation.current = requestAnimationFrame(applyMomentum);
    } else {
      momentumAnimation.current = null;
    }
  }, [ref]);

  const handleMouseDown = useCallback((e) => {
    if (!ref.current) return;
    stopMomentum();
    isDragging.current = true;
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
    lastX.current = e.pageX;
    lastTime.current = Date.now();
    velocity.current = 0;
    ref.current.style.cursor = "grabbing";
  }, [ref, stopMomentum]);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    if (isDragging.current) {
      isDragging.current = false;
      ref.current.style.cursor = "grab";
      applyMomentum();
    }
  }, [ref, applyMomentum]);

  const handleMouseUp = useCallback(() => {
    if (!ref.current) return;
    if (isDragging.current) {
      isDragging.current = false;
      ref.current.style.cursor = "grab";
      applyMomentum();
    }
  }, [ref, applyMomentum]);

  const handleMouseMove = useCallback((e) => {
    if (!ref.current || !isDragging.current) return;
    e.preventDefault();
    const container = ref.current;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const newScrollLeft = scrollLeft.current - walk;
    container.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));

    // Calculate velocity
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = (e.pageX - lastX.current) * 1.5;
      lastX.current = e.pageX;
      lastTime.current = now;
    }
  }, [ref]);

  return {
    onMouseDown: handleMouseDown,
    onMouseLeave: handleMouseLeave,
    onMouseUp: handleMouseUp,
    onMouseMove: handleMouseMove,
  };
}

export default function Page() {
    const FirstImage = "/assets/first_image.webp"
    const SecondImage = "/assets/second_image.webp"
    const ThirdImage = "/assets/third_image.webp"
    const MainImage = "/assets/product_homepage.webp"
    const router = useRouter();
      const searchParams = useSearchParams();
    
      const { user } = useAuthContext();
      const { addToCart, addToFavorite } = useUserActions();
      const [products, setProducts] = useState([]);
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
        const fetchProducts = async () => {
          try {
            const res = await axios.get("/products/all");
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

  return (
    <div className="overflow-x-hidden">
          {isClient && <Navbar alwaysVisible={true} />}
    
          {/* HERO SECTION */}
          <div className="flex justify-center items-center w-full min-h-screen bg-[#EE90B9] overflow-hidden relative max-[992px]:flex-col max-[992px]:pt-[6rem] max-[992px]:min-h-screen max-[992px]:text-center max-[992px]:px-4 max-[992px]:py-8 max-[992px]:gap-2 max-[600px]:flex-col max-[600px]:gap-20  max-[600px]:mt-[1rem]">
            <div className="flex flex-col ml-[7rem] justify-center w-[50%] text-[#1f2937] z-[2] max-[992px]:w-[90%] max-[992px]:ml-0">
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

            <div className="min-[992px]:pt-[5rem] w-[40rem] h-[50rem] z-[4] max-[600px]:scale-[0.72] max-[600px]:mt-[-11.5rem] max-[770px]:mt-[-7rem] max-[992px]:h-auto max-[992px]:mt-[-4rem] max-[992px]:scale-75 max-[992px]:w-[26rem] max-[992px]:h-[36rem]">
             <Image  
              sizes="(max-width: 992px) 100vw, 40rem (max-width: 992px) 100vw, 40rem"  
              priority
              src={MainImage} 
              alt="skin product" 
              width={640} 
              height={800} 
              quality={85}
              className="w-full h-full object-contain z-[5]"
              fetchPriority="high"
            />
            </div>
          </div>
    
      {/* OVERVIEW SECTION */}
      <div className="py-[4rem] max-[1350px]:mb-[-0.75rem] max-[1350px]:mt-[0.75rem] max-[1300px]:mb-[-7.35rem] max-[1300px]:mt-[2.35rem] max-[1300px]:mb-[-5.35rem] max-[1100px]:mb-[-12.5rem] max-[990px]:mb-[-22.5rem]  max-[990px]:mt-[-2.5rem]    relative max-[1390px]:[transform:scale(0.95)] max-[1300px]:[transform:scale(0.85)] max-[1250px]:[transform:scale(0.83)] max-[1200px]:[transform:scale(0.80)] max-[1150px]:[transform:scale(0.75)] max-[1100px]:[transform:scale(0.70)] max-[660px]:[transform:scale(0.65)] origin-top">
        <div className="flex flex-row items-center justify-center relative gap-[5rem] max-[990px]:mt-16 max-[990px]:flex-col max-[990px]:items-center max-[990px]:gap-[2rem]">
          <div className="flex flex-col justify-center items-start w-[35rem] mx-0 ml-4 z-[5] flex-shrink-0 max-[990px]:items-center self-center mt-[1rem]">
            <div className="text-[#eb61a1] text-[50px] font-bold font-[Arial,Helvetica,sans-serif] text-left w-full max-[990px]:text-center">
              LET'S HAVE A LOOK
            </div>
            <div className="mb-[1rem] text-black text-[25px] font-medium font-[Arial,Helvetica,sans-serif] text-left w-full max-[1390px]:mb-[0.75rem] max-[1300px]:mb-[0.75rem] max-[1250px]:mb-[0.5rem] max-[1200px]:mb-[0.5rem] max-[1150px]:mb-[0.5rem]  max-[660px]:mb-[0.25rem] max-[990px]:text-center">
              This is the overview about our products that you can spend a few minutes to see how they look.
            </div>
            <div className="flex flex-row gap-[2rem]">
              <div className="flex flex-row gap-[2rem] flex-shrink-0 max-[990px]:justify-center max-[990px]:items-center">
                <Image
                  src={FirstImage}
                  alt="Overview 1"
                  width={352}
                  height={352}
                  className="w-[18rem] h-[18rem] rounded-[10px] flex-shrink-0"
                />
                <Image
                  src={SecondImage}
                  alt="Overview 2"
                  width={352}
                  height={352}
                  className="rounded-[10px] w-[18rem] h-[18rem] flex-shrink-0"
                />
              </div>
            </div>
          </div>
          <div className="mt-[8rem] w-[38rem] h-[38rem] flex-shrink-0 max-[1390px]:mt-[7rem] max-[1300px]:mt-[6rem] max-[1250px]:mt-[5rem] max-[1200px]:mt-[4.5rem] max-[1150px]:mt-[4rem] max-[1100px]:mt-[3.5rem] max-[660px]:mt-[3rem] max-[990px]:ml-[1rem] max-[660px]:mb-[-5rem]"  >
            <Image src={ThirdImage} alt="Overview 3" width={560} height={480} className="w-full h-full object-cover rounded-[10px] block -mt-[3.3rem]" />
          </div>
        </div>
      </div>

      {/* LOGO MOVING SECTION */}
<div className="bg-[#0A3D3F] py-16 max-[1000px]:py-12 max-[600px]:py-10 overflow-hidden relative z-[1]">
  <div className="flex w-max animate-marquee">

    {/* SET 1 */}
    <div className="flex whitespace-nowrap">
      <span className="text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl font-bold text-[#FF0000] mx-12 italic">Emidi</span>
      <span className="text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl font-extrabold text-[#854DFF] mx-12">Pka</span>
      <span className="text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl font-medium text-white mx-12">Le</span>
      <span className="text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl font-bold text-[#DB14CD] mx-12 uppercase">Magi</span>
      <span className="text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl font-semibold text-[#FF0000] mx-12">CETAPHIL</span>
      <span className="text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl font-bold text-[#854DFF] mx-12 uppercase">Scarface</span>
    </div>

    {/* SET 2 (exact duplicate) */}
    <div className="flex whitespace-nowrap">
      <span className="text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl font-bold text-[#FF0000] mx-12 italic">Emidi</span>
      <span className="text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl font-extrabold text-[#854DFF] mx-12">Pka</span>
      <span className="text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl font-medium text-white mx-12">Le</span>
      <span className="text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl font-bold text-[#DB14CD] mx-12 uppercase">Magi</span>
      <span className="text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl font-semibold text-[#FF0000] mx-12">CETAPHIL</span>
      <span className="text-5xl max-[1000px]:text-4xl max-[600px]:text-3xl font-bold text-[#854DFF] mx-12 uppercase">Scarface</span>
    </div>

  </div>
</div>

          {/* PRODUCTS SECTION  */}
          <section id="product" className="py-20 px-8 bg-[#CCF6F2] text-center max-[1180px]:mt-[-3rem]">
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
                            src={getProductImageUrl(p, ThirdImage)}
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
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                              {brand}
                            </span>
                          )}
                          <h3 className="text-sm font-semibold text-gray-800 truncate" title={p?.name}>
                            {p?.name || "No Name"}
                          </h3>
                          <p className="text-xs text-gray-500 truncate" title={desc}>
                            {desc}
                          </p>
                          <p className="text-sm font-bold text-[#2563eb] mt-1">
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
          {/* CUSTOMER STORIES RECOMMENDATION SECTION */}
          <div className="bg-[#fff0f7] pt-8 pb-20 px-8">
            <div className="max-w-7xl mx-auto">

              {/* Header */}
              <div className="text-center mb-16">
                <h2 className="text-[4rem] font-bold text-[#3C3C3C] mb-4 max-[1000px]:text-[3rem] max-[600px]:text-[2.5rem]">
                  RECOMMENDATIONS
                </h2>
                <p className="text-[#000] text-[1.5rem] font-sans whitespace-pre-line text-left leading-relaxed max-[1000px]:text-[1.25rem] max-[600px]:text-[1.125rem]">
                  These reviews are based on feedback from real users who have used our products for more than 7 days.
                  During this time, customers experience the effectiveness, texture, and overall performance of our skincare solutions.
                  Average rating: 4.5 / 5
                  We continuously use this feedback to improve our products and deliver the best possible experience.
                </p>
              </div>

              {/* Featured Large Testimonial */}
             

              {/* 3-column smaller testimonials with click scroll */}
              <div className="relative">
                {/* Left scroll button with shadow */}
                <button
                  onClick={() => {
                    const container = document.getElementById('testimonials-container');
                    if (container) container.scrollBy({ left: -380, behavior: 'smooth' });
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.15)] rounded-full w-12 h-12 flex items-center justify-center text-[#eb61a2] hover:bg-[#eb61a2] hover:text-white transition-all duration-300 -ml-6"
                >
                  <FaChevronLeft size={20} />
                </button>

                {/* Right scroll button with shadow */}
                <button
                  onClick={() => {
                    const container = document.getElementById('testimonials-container');
                    if (container) container.scrollBy({ left: 380, behavior: 'smooth' });
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.15)] rounded-full w-12 h-12 flex items-center justify-center text-[#eb61a2] hover:bg-[#eb61a2] hover:text-white transition-all duration-300 -mr-6"
                >
                  <FaChevronRight size={20} />
                </button>

                {/* Gradient shadows on both sides */}
                <div ref={leftGradientRef} className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-[#fff0f7] to-transparent z-5 pointer-events-none transition-opacity duration-300"></div>
                <div ref={rightGradientRef} className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#fff0f7] to-transparent z-5 pointer-events-none transition-opacity duration-300"></div>

                <div
                  ref={testimonialsRef}
                  id="testimonials-container"
                  className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide cursor-grab select-none"
                  {...dragScrollHandlers}
                >
                  {[
                    {
                      image: "/assets/ImagesInRecommendation/profile_image.png",
                      name: "Dara Heng",
                      role: "Beauty Blogger",
                      stars: 5,
                      text: "Honestly the best moisturizer I have ever used. My skin stays hydrated all day — even in the hot Cambodian weather!",
                      date: "1 week ago"
                    },
                    {
                      image: "/assets/ImagesInRecommendation/phol_sophea_image.png",
                      name: "Lyda Keo",
                      role: "Yoga Instructor",
                      stars: 5,
                      text: "Clean ingredients, beautiful packaging, and it actually works. SKIN.ME is now a non-negotiable part of my morning ritual.",
                      date: "2 weeks ago"
                    },
                    {
                      image: "/assets/ImagesInRecommendation/bro_jirim_image.png",
                      name: "Manith Ros",
                      role: "Student",
                      stars: 4,
                      text: "Super affordable and effective. I got the serum and face wash combo — my skin has never looked this good. Will reorder for sure.",
                      date: "5 days ago"
                    },
                    {
                      image: "/assets/ImagesInRecommendation/obey_iamge.png",
                      name: "Sokha Chhay",
                      role: "Influencer",
                      stars: 5,
                      text: "Amazing results! My skin has never been this smooth. Highly recommend to everyone!",
                      date: "3 days ago"
                    },
                    {
                      image: "/assets/ImagesInRecommendation/ohio_image.png",
                      name: "Kim Heng",
                      role: "Model",
                      stars: 5,
                      text: "Perfect for sensitive skin. Love the natural ingredients and gentle formula.",
                      date: "1 week ago"
                    },
                    {
                      image: "/assets/ImagesInRecommendation/none_sence_image.png",
                      name: "Sok Dina",
                      role: "Content Creator",
                      stars: 4,
                      text: "Great value for money. The serum absorbs quickly without leaving any residue.",
                      date: "4 days ago"
                    },
                    {
                      image: "/assets/ImagesInRecommendation/boss_image.png",
                      name: "Vichea",
                      role: "Business Owner",
                      stars: 5,
                      text: "Been using for a month now and my skin looks younger and healthier!",
                      date: "2 weeks ago"
                    }
                  ].map((review, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(235,97,162,0.08)] border border-[#ffd6ec] flex flex-col gap-4 hover:shadow-[0_8px_25px_rgba(235,97,162,0.18)] transition-shadow duration-300 w-[350px] max-[1000px]:w-[300px] max-[600px]:w-[280px] flex-shrink-0"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={review.image}
                          alt={review.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-[#3C3C3C] text-sm">{review.name}</p>
                          <p className="text-[#aaa] text-xs">{review.role}</p>
                        </div>
                      </div>
                      <div className="bg-[#EDEDED] rounded-xl p-4 mt-2 flex flex-col justify-between flex-grow">
                        <div>
                          <div className="flex gap-2 mb-2">
                            {[1,2,3,4,5].map(i => (
                              <span key={i} className={`text-4xl ${i <= review.stars ? "text-yellow-400" : "text-transparent [-webkit-text-stroke:2px_#facc15]"}`}>★</span>
                            ))}
                          </div>
                          <p className="text-[#555] text-sm leading-relaxed">{review.text}</p>
                        </div>
                        <div className="flex justify-end pt-4">
                          <p className="text-xs text-[#999]">{review.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom stats bar */}
              <div className="mt-14 grid grid-cols-3 gap-4 text-center max-[1000px]:mt-10 max-[600px]:mt-8">
                {[
                  { number: "10,00+", label: "Happy Customers" },
                  { number: "4.8 / 5", label: "Average Rating" },
                  { number: "98%", label: "Would Recommend" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl py-6 px-4 border border-[#ffd6ec] shadow-sm max-[1000px]:py-4 max-[600px]:py-3">
                    <p className="text-3xl font-bold text-[#eb61a2] mb-1 max-[1000px]:text-2xl max-[600px]:text-xl">{stat.number}</p>
                    <p className="text-sm text-[#888] font-medium max-[1000px]:text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
    
          
          {/* ABOUT US SECTION - unchanged */}
          <div id="aboutus" className="pt-8 pb-20 px-8 text-center">
            <div className="max-w-7xl mx-auto">
              <p className="text-[4rem] font-bold text-[#000] mb-6 max-[1000px]:text-[3rem] max-[600px]:text-[2.5rem]">ABOUT US</p>
              <div className="text-[#000] text-[1.5rem] font-sans text-left leading-relaxed w-full max-[1000px]:text-[1.25rem] max-[600px]:text-[1.125rem]">
                <p className="mb-2"><span className="font-bold">SKIN.ME</span> is more than skincare — it's a daily ritual of self-respect and renewal.</p>

                <p className="mb-2">We create minimalist, effective formulas designed for real skin and real lives. Inspired by nature and backed by science, our products are gentle yet powerful.</p>

                <p className="mb-2"><span className="font-bold">Our Promise:</span></p>
                <ul className="list-disc list-inside mb-2">
                  <li>Clean and safe ingredients</li>
                  <li>Honest and transparent beauty</li>
                  <li>Simple, effective skincare</li>
                </ul>

                <p>Every product reflects our commitment to quality and care. Join us in redefining skincare with confidence and simplicity.</p>
              </div>
            </div>
            <div className="flex justify-center mt-8 max-w-7xl mx-auto gap-[3rem]">
              <Image src={FirstImage} alt="About 1" width={280} height={280} className="w-[310px] h-[310px] max-[1400px]:w-[290px] max-[1400px]:h-[290px] max-[1350px]:w-[280px] max-[1350px]:h-[280px] max-[1300px]:w-[260px] max-[1300px]:h-[260px] max-[1250px]:w-[250px] max-[1250px]:h-[250px] max-[1200px]:w-[240px] max-[1200px]:h-[240px] max-[1150px]:w-[230px] max-[1150px]:h-[230px] max-[1050px]:w-[200px] max-[1050px]:h-[200px] max-[1000px]:w-[210px] max-[1000px]:h-[210px] max-[950px]:w-[190px] max-[950px]:h-[190px] rounded-[10px] object-cover" />
              <Image src={SecondImage} alt="About 2" width={280} height={280} className="w-[310px] h-[310px] max-[1400px]:w-[290px] max-[1400px]:h-[290px] max-[1350px]:w-[280px] max-[1350px]:h-[280px] max-[1300px]:w-[260px] max-[1300px]:h-[260px] max-[1250px]:w-[250px] max-[1250px]:h-[250px] max-[1200px]:w-[240px] max-[1200px]:h-[240px] max-[1150px]:w-[230px] max-[1150px]:h-[230px] max-[1050px]:w-[200px] max-[1050px]:h-[200px] max-[1000px]:w-[210px] max-[1000px]:h-[210px] max-[950px]:w-[190px] max-[950px]:h-[190px] -ml-8 rounded-[10px] object-cover" />
              <Image src={ThirdImage} alt="About 3" width={280} height={280} className="w-[310px] h-[310px] max-[1400px]:w-[290px] max-[1400px]:h-[290px] max-[1350px]:w-[280px] max-[1350px]:h-[280px] max-[1300px]:w-[260px] max-[1300px]:h-[260px] max-[1250px]:w-[250px] max-[1250px]:h-[250px] max-[1200px]:w-[240px] max-[1200px]:h-[240px] max-[1150px]:w-[230px] max-[1150px]:h-[230px] max-[1050px]:w-[200px] max-[1050px]:h-[200px] max-[1000px]:w-[210px] max-[1000px]:h-[210px] max-[950px]:w-[190px] max-[950px]:h-[190px] -ml-8 rounded-[10px] object-cover" />
              <Image src={FirstImage} alt="About 4" width={280} height={280} className="w-[310px] h-[310px] max-[1400px]:w-[290px] max-[1400px]:h-[290px] max-[1350px]:w-[280px] max-[1350px]:h-[280px] max-[1300px]:w-[260px] max-[1300px]:h-[260px] max-[1250px]:w-[250px] max-[1250px]:h-[250px] max-[1200px]:w-[240px] max-[1200px]:h-[240px] max-[1150px]:w-[230px] max-[1150px]:h-[230px] max-[1050px]:w-[200px] max-[1050px]:h-[200px] max-[1000px]:w-[210px] max-[1000px]:h-[210px] max-[950px]:w-[190px] max-[950px]:h-[190px] -ml-8 rounded-[10px] object-cover" />
            </div>
          </div>
          <Footer />
    </div>
  );
}