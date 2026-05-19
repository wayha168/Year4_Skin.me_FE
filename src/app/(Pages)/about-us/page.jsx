"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";

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

const AboutUsPage = () => {
  const FirstImage = "/assets/first_image.webp";
  const SecondImage = "/assets/second_image.webp";
  const ThirdImage = "/assets/third_image.webp";

  return (
    <>
      <Navbar alwaysVisible={true} />

      <main className="pt-[5rem] px-0 pb-16 bg-[#F7F7F7] font-[Poppins,sans-serif]">
        {/* ===== Hero Section ===== */}
        <div className="w-full -mt-[4.5rem]">
          <h1 className="mt-[12px] w-full h-[9rem] flex items-end justify-center max-[750px]:justify-end text-4xl font-bold  bg-[#F7F7F7] text-[#EB61A2] pb-[13px] max-[750px]:pr-4 max-[750px]:text-[1.8rem]">
            About Us
          </h1>
        </div>

        <div className="px-4 sm:px-6">
          <div className="max-w-7xl mt-4 mx-auto -mb-[4rem]">
            <h1 className="text-2xl sm:text-3xl font-bold opacity-100 text-[#EB61A1]">SKIN.ME</h1>
          </div>
        </div>

        {/* ===== Original About Us Content ===== */}
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
            window.addEventListener("pageshow", handlePageShow);
            return () => window.removeEventListener("pageshow", handlePageShow);
          }, []);

          const [aboutRef, aboutVisible] = useScrollAnimation();
          const finalVisible = aboutVisible || hasAnimated;

          return (
            <div
              ref={aboutRef}
              id="aboutus"
              className={`pt-[5rem] pb-20 px-8 text-center ${noAnimation ? "" : "transition-all duration-1000 ease-out delay-300"} ${finalVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-32"}`}
            >
              <div className="max-w-7xl mx-auto">
                <div className="text-[#000] text-[1.5rem] font-sans text-left leading-relaxed w-full max-[1000px]:text-[1.25rem] max-[600px]:text-[1.125rem]">
                  <p className="mb-2">
                    <span className="font-bold">SKIN.ME</span> is more than skincare — it's a daily ritual of self-respect and renewal.
                  </p>

                  <p className="mb-2">
                    We create minimalist, effective formulas designed for real skin and real lives. Inspired by nature and backed by science, our products are gentle yet powerful.
                  </p>

                  <p className="mb-2">
                    <span className="font-bold">Our Promise:</span>
                  </p>
                  <ul className="list-disc list-inside mb-2">
                    <li>Clean and safe ingredients</li>
                    <li>Honest and transparent beauty</li>
                    <li>Simple, effective skincare</li>
                  </ul>

                  <p>Every product reflects our commitment to quality and care. Join us in redefining skincare with confidence and simplicity.</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-[2rem] mt-8 max-w-7xl mx-auto justify-center max-[992px]:grid-cols-2 max-[600px]:gap-[1rem]">
                <Image src={FirstImage} alt="About 1" width={280} height={280} className="w-full h-auto rounded-[10px] object-cover" />
                <Image src={SecondImage} alt="About 2" width={280} height={280} className="w-full h-auto rounded-[10px] object-cover" />
                <Image src={ThirdImage} alt="About 3" width={280} height={280} className="w-full h-auto rounded-[10px] object-cover" />
                <Image src={FirstImage} alt="About 4" width={280} height={280} className="w-full h-auto rounded-[10px] object-cover" />
              </div>
            </div>
          );
        })()}
      </main>

      <Footer />
    </>
  );
};

export default AboutUsPage;
