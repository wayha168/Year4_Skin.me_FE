// src/Components/Footer/Footer.jsx
// ============================================
import Image from "next/image";
import { memo } from "react";

const Footer = memo(() => {
  const Aba = "/assets/ABA.png";
  const Acelida = "/assets/acelida.png";
  const Visa = "/assets/Visa.png";
  const Paypal = "/assets/paypal.png";
  const TIKTOK = "/assets/tiktok_icon.png";
  const TWITER = "/assets/twitter_icon.png";
  const FACEBOOK = "/assets/facebook_icon_social.png";
  const PINTEREST = "/assets/pinterest_icon.png";
  const INSTARGRAM = "/assets/instargram_icon.png";

  return (
    <div className="bg-[#0a3d3f] text-white pb-[2rem] mt-0 max-[770px]:pb-[7rem]">
      {/* TOP BANNER */}
      <div className="mb-[2rem] flex justify-between items-center h-12 w-full border-b border-white/20 bg-black mt-0">
        <div className="flex justify-between items-center w-full max-w-[1280px] mx-auto px-4">
          <span className="text-xl md:text-2xl font-bold text-[#eb61a1]">SKIN.ME</span>
          <span className="text-base md:text-lg font-medium font-sans">Up to 25% off</span>
        </div>
      </div>

      {/* MAIN ROW */}
      <div className="flex justify-between gap-8 sm:gap-12 md:gap-16 lg:gap-24 xl:gap-32 2xl:gap-48 max-w-[1280px] mx-auto px-4 flex-wrap min-[1160px]:flex-nowrap max-[920px]:justify-center max-[650px]:flex-col max-[650px]:items-center">

        {/* SKIN.ME + PAYMENT + NEWSLETTER */}
        <div className="flex-1 min-w-[250px] flex flex-col items-start max-[650px]:items-center max-[650px]:text-center">
          <p className="text-2xl font-bold mb-4">SKIN.ME</p>

          {/* PAYMENT ICONS */}
          <div className="flex flex-wrap gap-3 mb-4 max-[650px]:justify-center">
            <Image src={Aba} alt="ABA" width={50} height={32} loading="lazy" className="w-[50px] h-auto" style={{ width: "auto", height: "auto" }} />
            <Image src={Visa} alt="Visa" width={50} height={32} loading="lazy" className="w-[50px] h-auto" style={{ width: "auto", height: "auto" }} />
            <Image src={Paypal} alt="Paypal" width={50} height={32} loading="lazy" className="w-[50px] h-auto" style={{ width: "auto", height: "auto" }} />
            <Image src={Acelida} alt="Acelida" width={50} height={32} loading="lazy" className="w-[50px] h-auto" style={{ width: "auto", height: "auto" }} />
          </div>

          {/* NEWSLETTER */}
          <div className="mt-4">
            <div>
              <p className="text-lg font-bold">NEWSLETTER</p>
              <p className="text-sm mt-1">
                Subscribe to receive updates, access to exclusive deals, and more.
              </p>
            </div>

            <div className="flex gap-3 mt-3 max-[1030px]:flex-col max-[1030px]:items-start max-[650px]:items-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-3 py-2 rounded-md border border-white text-white/70 placeholder:text-white/70 w-full min-[1160px]:w-[250px] max-[1030px]:w-[80%] focus:outline-none focus:border-white"
                style={{ backgroundColor: '#0A3D3F' }}
              />
              <button className="bg-white text-black px-5 py-2 rounded-md max-[1030px]:w-[80%] hover:bg-[#eb61a1] hover:text-white transition-all duration-300">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* GENERAL */}
        <div className="flex-1 min-w-[250px] flex flex-col items-start max-[650px]:items-center max-[650px]:text-center">
          <p className="text-2xl font-bold mb-4">GENERAL</p>

          <div className="flex flex-col gap-2 max-[650px]:items-center">
            <p>Location</p>
            <p>Privacy Policy</p>
            <p>Cookie</p>
          </div>
        </div>

        {/* GET TO KNOW US */}
        <div className="flex-1 min-w-[250px] flex flex-col items-start max-[650px]:items-center max-[650px]:text-center">
          <p className="text-2xl font-bold mb-4">GET TO KNOW US</p>

          <div className="flex flex-col gap-2 max-[650px]:items-center">
            <p>About</p>
            <p>Blog</p>
            <p>Email: mrjr@gmail.com</p>
            <p>Phone: 098249823</p>
          </div>
        </div>

        {/* SOCIAL */}
        <div className="flex-1 min-w-[250px] flex flex-col items-start max-[650px]:items-center max-[650px]:text-center">
          <p className="text-2xl font-bold mb-4">SOCIAL</p>

          {/* Icons wrapper */}
          <div className="flex flex-col gap-2 max-[650px]:items-center">
            <Image src={TIKTOK} width={30} height={30} loading="lazy" className="w-[30px] h-auto" alt="TikTok" style={{ width: "auto", height: "auto" }} />
            <Image src={FACEBOOK} width={30} height={30} loading="lazy" className="w-[30px] h-auto" alt="Facebook" style={{ width: "auto", height: "auto" }} />
            <Image src={INSTARGRAM} width={30} height={30} loading="lazy" className="w-[30px] h-auto" alt="Instagram" style={{ width: "auto", height: "auto" }} />
            <Image src={PINTEREST} width={30} height={30} loading="lazy" className="w-[30px] h-auto" alt="Pinterest" style={{ width: "auto", height: "auto" }} />
            <Image src={TWITER} width={30} height={30} loading="lazy" className="w-[30px] h-auto" alt="Twitter" style={{ width: "auto", height: "auto" }} />
          </div>
        </div>

      </div>

      {/* BOTTOM TEXT */}
      <div className="text-center mt-10 text-gray-300 text-sm">
        © SKIN.ME — Only sell you the great product
      </div>
    </div>
  );
});

Footer.displayName = "Footer";

export default Footer