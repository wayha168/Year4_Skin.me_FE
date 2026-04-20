"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {useRouter,  useSearchParams } from "next/navigation";
import { useState } from "react";
import axios from "./lib/api/axiosConfig.js";
import Navbar from "../Components/Navbar/Navbar.jsx";
import Footer from "../Components/Footer/Footer.jsx";
import useUserActions from "../Components/Hooks/userUserActions.js";
import useAuthContext from "./lib/Authentication/AuthContext.jsx";
import LoginFirst from "../Components/LoginFirst/LoginFirst.js";
import { FaCartPlus, FaHeart } from "react-icons/fa";
import { getProductImageUrl } from "./lib/productImage.js";
import { formatPrice } from "./lib/formatPrice.js";

export default function Page() {
    const FirstImage = "/assets/first_image.png"
    const SecondImage = "/assets/second_image.png"
    const ThirdImage = "/assets/third_image.png"
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
          <div className="flex justify-center items-center w-full min-h-screen bg-[#EE90B9] overflow-hidden relative max-[992px]:flex-col max-[992px]:pt-[9rem] max-[992px]:min-h-screen max-[992px]:text-center max-[992px]:px-4 max-[992px]:py-12 max-[760px]:flex-col max-[760px]:gap-20">
            <div className="flex flex-col ml-[7rem] justify-center w-[50%] text-[#1f2937] z-[2] max-[992px]:w-[90%] max-[992px]:ml-0">
              <p className="text-[57px] font-bold text-[#3C3C3C] max-[600px]:text-[27px]">WELCOME TO SKIN.ME</p>
              <p className="tracking-[-0.05em] text-[44px] font-semibold text-white mb-4 max-[992px]:text-[32px] max-[600px]:text-[35px]">Most Essential Skin Care Product</p>
              <p className="opacity-[0.8] text-[20px] text-[#4c4c4c] mb-10 max-[600px]:text-xl">Give you the best skincare | product is our mission.</p>
              <div> 
                <button 
                  onClick={scrollToProducts} 
                  className="opacity-[1] text-white text-[30px] font-semibold px-[50px] py-3.5 bg-[#FA4497] rounded-[7px] border-none cursor-pointer transition-all duration-200 hover:bg-[#c8538a] active:bg-[#e33486] max-[992px]:text-lg  max-[992px]:px-10 max-[992px]:py-3 max-[600px]:text-base max-[600px]:px-[30px] max-[600px]:py-2.5"
                >
                  Shop Now
                </button>
              </div>
            </div>

            <div className="min-[992px]:pt-[5rem] w-[40rem] h-[50rem] z-[4] max-[760px]:scale-[0.8] max-[760px]:mt-[-10rem] max-[992px]:h-auto ">
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
      <div className="flex flex-row items-center justify-center relative gap-[3rem] max-[1180px]:mt-16 max-[1180px]:flex-col max-[660px]:flex-col max-[660px]:my-0 max-[660px]:mx-auto">
        <div className="flex flex-col justify-center items-start w-[35rem] mx-0 ml-4 z-[5] max-[660px]:w-full max-[660px]:mx-0 max-[660px]:mb-8">
          <div className=" text-[#eb61a1] text-[50px] font-bold font-[Arial,Helvetica,sans-serif] text-left w-full">
            LET'S HAVE A LOOK
          </div>
          <div className="mb-8 text-black text-[25px] font-medium font-[Arial,Helvetica,sans-serif] text-left w-full">
            This is the overview about our products that you can spend a few minutes to see how they look.
          </div>
          <div className="flex flex-row gap-4 max-[660px]:justify-center max-[660px]:items-center max-[660px]:gap-4">
            <Image
              src={FirstImage}
              alt="Overview 1"
              width={352}
              height={352}
              className="w-[18rem] h-[18rem] rounded-[10px] max-[1180px]:scale-100 max-[1180px]:mb-[-11rem] max-[1180px]:z-[3] max-[660px]:scale-[0.8] max-[660px]:mb-0"
            />
            <Image
              src={SecondImage}
              alt="Overview 2"
              width={352}
              height={352}
              className="rounded-[10px] w-[18rem] h-[18rem] max-[1180px]:scale-100 max-[1180px]:mb-[-11rem] max-[1180px]:z-[3] max-[660px]:scale-[0.8] max-[660px]:mb-0"
            />
          </div>
        </div>
        <div className="mt-28 w-[38rem] h-[38rem] max-[1180px]:mb-40 max-[660px]:mt-4 max-[660px]:mb-0 max-[1180px]:mt-[6.3rem] ">
          <Image src={ThirdImage} alt="Overview 3" width={560} height={480} className="w-full h-full object-cover rounded-[10px] block -mt-[3.3rem] max-[1180px]:scale-100 max-[1180px]:w-[35rem] max-[1180px]:h-[30rem] max-[1180px]:my-auto max-[1180px]:mt-[5.5rem] max-[660px]:mt-[-5.5rem] max-[660px]:w-[90%] max-[660px]:h-auto max-[660px]:mx-auto max-[660px]:scale-[0.9]" />
        </div>
      </div>

          {/* PRODUCTS SECTION  */}
          <section id="product" className="py-20 px-8 bg-white text-center max-[1180px]:mt-[-3rem]">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-12 px-5 uppercase">
                <h2 className="text-4xl text-[#eb61a2] font-bold max-[600px]:text-[28px]">Products</h2>
                <button 
                  className="bg-[#eb61a2] text-white border-none px-6 py-3 rounded-2xl text-xl cursor-pointer transition-[0.1s] ease hover:bg-[#c8538a] max-[600px]:text-sm"
                  onClick={() => router.push("/products")}
                >
                  All Products
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
          <div className="bg-[#fff0f7] py-20 px-8">
            <div className="max-w-7xl mx-auto">

              {/* Header */}
              <div className="text-center mb-16">
                <span className="inline-block bg-[#eb61a2] text-white text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-4">
                  Real Stories
                </span>
                <h2 className="text-4xl font-bold text-[#3C3C3C] mb-4">
                  What Our Community Says
                </h2>
                <p className="text-[#777] text-lg max-w-xl mx-auto">
                  Join thousands of happy customers who transformed their skincare routine with SKIN.ME.
                </p>
              </div>

              {/* Featured Large Testimonial */}
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(235,97,162,0.12)] p-10 mb-10 flex flex-col md:flex-row items-center gap-8 border border-[#ffd6ec]">
                <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full bg-[#ffd0ed] flex items-center justify-center text-4xl">
                    🌸
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[#3C3C3C] text-lg">Sreymom Chan</p>
                    <p className="text-[#eb61a2] text-sm font-medium">Verified Buyer ✓</p>
                    <div className="flex gap-1 justify-center mt-1">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className="text-yellow-400 text-lg">★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[#eb61a2] text-5xl font-serif leading-none mb-3">&ldquo;</p>
                  <p className="text-[#444] text-xl leading-relaxed font-medium italic">
                    I&apos;ve tried so many skincare brands but SKIN.ME is different. After just two weeks,
                    my skin felt smoother and my breakouts reduced significantly. The texture is light,
                    absorbs fast, and smells amazing. I genuinely look forward to my skincare routine now!
                  </p>
                  <p className="text-[#eb61a2] text-5xl font-serif leading-none text-right mt-2">&rdquo;</p>
                  <p className="text-sm text-[#aaa] mt-3">Posted 3 days ago · Phnom Penh, Cambodia</p>
                </div>
              </div>

              {/* 3-column smaller testimonials */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    emoji: "💆‍♀️",
                    name: "Dara Heng",
                    role: "Beauty Blogger",
                    stars: 5,
                    text: "Honestly the best moisturizer I have ever used. My skin stays hydrated all day — even in the hot Cambodian weather!",
                    date: "1 week ago"
                  },
                  {
                    emoji: "🌿",
                    name: "Lyda Keo",
                    role: "Yoga Instructor",
                    stars: 5,
                    text: "Clean ingredients, beautiful packaging, and it actually works. SKIN.ME is now a non-negotiable part of my morning ritual.",
                    date: "2 weeks ago"
                  },
                  {
                    emoji: "✨",
                    name: "Manith Ros",
                    role: "Student",
                    stars: 4,
                    text: "Super affordable and effective. I got the serum and face wash combo — my skin has never looked this good. Will reorder for sure.",
                    date: "5 days ago"
                  }
                ].map((review, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-6 shadow-[0_4px_15px_rgba(235,97,162,0.08)] border border-[#ffd6ec] flex flex-col gap-4 hover:shadow-[0_8px_25px_rgba(235,97,162,0.18)] transition-shadow duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#ffd0ed] flex items-center justify-center text-2xl flex-shrink-0">
                        {review.emoji}
                      </div>
                      <div>
                        <p className="font-bold text-[#3C3C3C] text-sm">{review.name}</p>
                        <p className="text-[#aaa] text-xs">{review.role}</p>
                      </div>
                      <div className="ml-auto flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <span key={i} className={`text-sm ${i <= review.stars ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[#555] text-sm leading-relaxed flex-1">{review.text}</p>
                    <p className="text-xs text-[#ccc]">{review.date}</p>
                  </div>
                ))}
              </div>

              {/* Bottom stats bar */}
              <div className="mt-14 grid grid-cols-3 gap-4 text-center">
                {[
                  { number: "10,000+", label: "Happy Customers" },
                  { number: "4.8 / 5", label: "Average Rating" },
                  { number: "98%", label: "Would Recommend" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl py-6 px-4 border border-[#ffd6ec] shadow-sm">
                    <p className="text-3xl font-bold text-[#eb61a2] mb-1">{stat.number}</p>
                    <p className="text-sm text-[#888] font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
    
          
          {/* ABOUT US SECTION - unchanged */}
          <div id="aboutus" className="bg-[#ffd0ed] py-20 px-8 text-center">
            <div>
              <p className="text-4xl font-bold text-[#d13e82] mb-6">About Us</p>
              <p className="text-[22px] text-[#333] max-w-[900px] mx-auto mb-12">
                SKIN.ME is more than skincare — it's a daily ritual of self-respect and renewal. We craft
                minimalist, effective formulas designed for real skin and real lives.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-4 justify-items-center max-[1190px]:scale-95 max-[1000px]:grid-cols-[repeat(2,20rem)] max-[1000px]:justify-center max-[1000px]:scale-110 max-[770px]:pt-8 max-[770px]:grid-cols-[repeat(2,15rem)] max-[770px]:justify-center max-[770px]:scale-110 max-[650px]:grid-cols-1 max-[650px]:justify-center max-[650px]:py-20 max-[650px]:scale-[1.2]">
              <Image src={FirstImage} alt="About 1" width={300} height={300} className="w-full max-w-[18rem] h-[18rem] rounded-[10px] object-cover" style={{ width: "auto", height: "auto" }} />
              <Image src={SecondImage} alt="About 2" width={300} height={300} className="w-full max-w-[18rem] h-[18rem] rounded-[10px] object-cover" style={{ width: "auto", height: "auto" }} />
              <Image src={ThirdImage} alt="About 3" width={300} height={300} className="w-full max-w-[18rem] h-[18rem] rounded-[10px] object-cover" style={{ width: "auto", height: "auto" }} />
              <Image src={FirstImage} alt="About 4" width={300} height={300} className="w-full max-w-[18rem] h-[18rem] rounded-[10px] object-cover" style={{ width: "auto", height: "auto" }} />
            </div>
          </div>
          
    
          <Footer />
    </div>
  );
}