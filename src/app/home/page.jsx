// src/app/page.jsx   ← your homepage

"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import {  useSearchParams } from "next/navigation";

import Navbar from "../Components/Navbar/Navbar.jsx";
import Footer from "../Components/Footer/Footer.jsx";
// import axios from "../api/axiosConfig";
// import useUserActions from "../Components/Hooks/userUserActions";
// import useAuthContext from "../Authentication/AuthContext";
// import LoginFirst from "../Components/LoginFirst/LoginFirst";

import { FaCartPlus, FaHeart } from "react-icons/fa";

const MainImage = "/assets/product_homepage.png";
const FirstImage = "/assets/first_image.png";
const SecondImage = "/assets/second_image.png";
const ThirdImage = "/assets/third_image.png";

const HomePage = () => {
  // const router = useRouter();
  const searchParams = useSearchParams();

  // const { user } = useAuthContext();
  // // const { addToCart, addToFavorite } = useUserActions();
  // const [products, setProducts] = useState([]);
  // const [loading, ing] = useState(true);

  // const loginFirst = new LoginFirst(user, router);

  const scrollToProducts = () => {
    const section = document.getElementById("product");
    if (section) {
      const navbarHeight = document.querySelector(".navbar-wrapper")?.offsetHeight || 0;
      const y = section.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (searchParams.get("scroll") === "product") {
      scrollToProducts();
    }
  }, [searchParams]);

  // useEffect(() => {
  //   const fetchProducts = async () => {
  //     try {
  //       const res = await axios.get("/products/all", { withCredentials: true });
  //       setProducts(res?.data?.data || []);
  //     } catch (err) {
  //       console.error("Error fetching products:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchProducts();
  // }, []);

  // const handleFavoriteClick = async (productId) => {
  //   if (!user) {
  //     const message = loginFirst.messages.loginRequiredFavorite;
  //     loginFirst.safeNavigate("/login", {
  //       search: `?redirect=${encodeURIComponent("/")}&message=${encodeURIComponent(message)}`,
  //     });
  //     return;
  //   }
  //   await addToFavorite(productId);
  // };

  // const handleAddToCartClick = async (productId) => {
  //   if (!user) {
  //     const message = loginFirst.messages.loginRequiredCart;
  //     loginFirst.safeNavigate("/login", {
  //       search: `?redirect=${encodeURIComponent("/")}&message=${encodeURIComponent(message)}`,
  //     });
  //     return;
  //   }
  //   await addToCart(productId, 1);
  // };

  return (
    <>
      <Navbar alwaysVisible={true} />

      {/* HERO SECTION */}
      <div className="flex justify-center items-center w-full h-screen bg-gradient-to-b from-[#fddcff] to-[#af6793] mt-16 overflow-hidden relative max-[992px]:flex-col max-[992px]:h-auto max-[992px]:text-center max-[992px]:px-4 max-[992px]:py-12 max-[760px]:flex-col max-[760px]:gap-20">
        <div className="absolute bg-[#ab8fff] rounded-[1000px] z-0 left-[-25rem] top-16 w-[30rem] h-[30rem] max-[992px]:hidden"></div>
        
        <div className="flex flex-col ml-[7rem] justify-center w-[50%] text-[#1f2937] z-[2] max-[992px]:w-[90%] max-[992px]:ml-0">
          <p className="text-[27px] font-medium text-[#eb61a1] mb-4 max-[600px]:text-[27px]">Welcome to SKIN.ME</p>
          <p className="text-[44px] font-semibold text-white mb-4 max-[992px]:text-[32px] max-[600px]:text-[35px]">Most Essential Skin Care Product</p>
          <p className="text-xl text-[#4c4c4c] mb-10 max-[600px]:text-xl">Give you the best skincare products is our mission.</p>
          <div> 
            <button 
              onClick={scrollToProducts} 
              className="text-white text-[22px] font-semibold px-[50px] py-3.5 bg-[#eb61a2] rounded-[15px] border-none cursor-pointer transition-all duration-200 hover:bg-[#c8538a] active:bg-[#e33486] max-[992px]:text-lg max-[992px]:px-10 max-[992px]:py-3 max-[600px]:text-base max-[600px]:px-[30px] max-[600px]:py-2.5"
            >
              Shop Now
            </button>
          </div>
        </div>
        
        <div className="w-[40rem] z-[4] max-[760px]:scale-[0.8] max-[760px]:mt-[-10rem]">
          <Image src={MainImage} alt="skin product" width={800} height={800} className="h-[50rem] object-contain z-[5] max-[992px]:w-full max-[992px]:h-auto" />
        </div>
        
        <div className="absolute bg-[#ab8fff] rounded-[1000px] z-0 right-[-25rem] top-80 w-[30rem] h-[30rem] max-[992px]:hidden max-[760px]:right-[-25rem]"></div>
      </div>

      {/* ... (rest of your sections - unchanged) ... */}

      {/* PRODUCTS SECTION 
      <section id="product" className="py-20 px-8 bg-white text-center max-[1180px]:mt-[-3rem]">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12 px-5 uppercase">
            <h2 className="text-4xl text-[#eb61a2] font-bold max-[600px]:text-[28px]">Product</h2>
            <button 
              className="bg-[#eb61a2] text-white border-none px-6 py-3 rounded-2xl text-xl cursor-pointer transition-[0.1s] ease hover:bg-[#c8538a] max-[600px]:text-sm"
              onClick={() => router.push("/products")}
            >
              All Product
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 text-lg mt-20">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500 text-lg mt-20">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.slice(0, 10).map((p) => (
                <div 
                  key={p.id} 
                  className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-4 flex flex-col justify-between transition-[transform_0.3s_ease,box-shadow_0.3s_ease] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-[100]"
                >
                  <div className="relative">
                    <Image
                      src={
                        p?.images?.[0]?.downloadUrl
                          ? `https://backend.skinme.store${p.images[0].downloadUrl}`
                          : ThirdImage
                      }
                      alt={p.name}
                      width={300}
                      height={200}
                      className="w-full h-[200px] object-cover rounded-2xl cursor-pointer transition-transform duration-300 hover:scale-105 max-[600px]:h-[200px]"
                      onClick={() => router.push(`/check_out?productId=${p.id}`)}
                    />
                    <button 
                      className="absolute top-2 right-2 bg-white/85 rounded-full p-1.5 text-[#f56565] text-base cursor-pointer transition-[background_0.2s] hover:bg-[#fed7d7]"
                      onClick={() => handleFavoriteClick(p.id)}
                    >
                      <FaHeart />
                    </button>
                  </div>
                  <div className="flex flex-col justify-between px-3 py-2.5 flex-grow">
                    <h3 className="text-base font-semibold text-[#2d3748] leading-tight overflow-hidden text-ellipsis whitespace-nowrap max-[600px]:text-base">{p.name}</h3>
                    <p className="text-base font-bold text-[#2563eb] my-1.5 max-[600px]:text-sm">${p.price}</p>
                    <button 
                      className="mt-auto bg-[#d13e82] border-none rounded-xl px-5 py-2.5 text-white font-semibold cursor-pointer flex items-center justify-center gap-2 text-[0.95rem] shadow-[0_4px_12px_rgba(209,62,130,0.3)] transition-all duration-300 hover:bg-[#c32c70] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_6px_15px_rgba(209,62,130,0.4)] active:-translate-y-px active:scale-[0.98] active:shadow-[0_4px_10px_rgba(209,62,130,0.3)]"
                      onClick={() => handleAddToCartClick(p.id)}
                    >
                      <FaCartPlus className="text-[1.1rem] transition-transform duration-300" /> Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
          <Image src={FirstImage} alt="About 1" width={300} height={300} className="w-full max-w-[18rem] h-[18rem] rounded-[10px] object-cover" />
          <Image src={SecondImage} alt="About 2" width={300} height={300} className="w-full max-w-[18rem] h-[18rem] rounded-[10px] object-cover" />
          <Image src={ThirdImage} alt="About 3" width={300} height={300} className="w-full max-w-[18rem] h-[18rem] rounded-[10px] object-cover" />
          <Image src={FirstImage} alt="About 4" width={300} height={300} className="w-full max-w-[18rem] h-[18rem] rounded-[10px] object-cover" />
        </div>
      </div>

      <Footer />
    </>
  );
};

export default HomePage;