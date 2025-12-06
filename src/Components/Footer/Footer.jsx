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
    <div className="bg-[#0a3d3f] text-white py-12">
      {/* MAIN ROW */}
      <div className="flex justify-around gap-8 mx-4 flex-wrap lg:flex-nowrap">

        {/* SKIN.ME + PAYMENT + NEWSLETTER */}
        <div className="flex-1 min-w-[250px] flex flex-col max-[579px]:items-center">
          <p className="text-2xl font-bold mb-4">SKIN.ME</p>

          {/* PAYMENT ICONS */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Image src={Aba} alt="ABA" width={50} height={32} loading="lazy" className="w-[50px] h-auto" />
            <Image src={Visa} alt="Visa" width={50} height={32} loading="lazy" className="w-[50px] h-auto" />
            <Image src={Paypal} alt="Paypal" width={50} height={32} loading="lazy" className="w-[50px] h-auto" />
            <Image src={Acelida} alt="Acelida" width={50} height={32} loading="lazy" className="w-[50px] h-auto" />
          </div>

          {/* NEWSLETTER */}
          <div className="mt-4 max-[579px]:justify-center"> 
            <div>           
              <p className="text-lg font-bold max-[579px]:flex justify-center">NEWSLETTER</p>
              <p className="text-sm mt-1">
                Subscribe to receive updates, access to exclusive deals, and more.
              </p>
            </div>

            <div className="flex gap-3 mt-3 max-[1030px]:flex-col max-[1030px]:items-start max-[579px]:items-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 rounded-md text-black w-full max-[1030px]:w-[80%]"
              />
              <button className="bg-[#fcb8c2] text-black px-5 py-2 rounded-md max-[1030px]:w-[80%]">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* GENERAL */}
        <div className="flex-1 min-w-[250px] flex flex-col items-start max-[1030px]:items-center text-left max-[1030px]:text-center">
          <p className="text-2xl font-bold mb-4">GENERAL</p>

          <div className="flex flex-col gap-2">
            <p>Location</p>
            <p>Privacy Policy</p>
            <p>Cookie</p>
          </div>
        </div>

        {/* GET TO KNOW US */}
        <div className="flex-1 min-w-[250px] flex flex-col items-start max-[1030px]:items-center text-left max-[1030px]:text-center">
          <p className="text-2xl font-bold mb-4">GET TO KNOW US</p>

          <div className="flex flex-col gap-2">
            <p>About</p>
            <p>Blog</p>
            <p>Email: mrjr@gmail.com</p>
            <p>Phone: 098249823</p>
          </div>
        </div>

        {/* SOCIAL */}
        <div className="flex-1 min-w-[250px] flex flex-col items-start max-[1030px]:items-center text-left max-[1030px]:text-center">
          <p className="text-2xl font-bold mb-4">SOCIAL</p>

          {/* Icons wrapper */}
          <div className="flex flex-col gap-2 ml-[-4px] max-[1030px]:flex-row max-[1030px]:justify-center max-[1030px]:ml-0">
            <Image src={TIKTOK} width={30} height={30} loading="lazy" className="w-[30px] h-auto" alt="TikTok" />
            <Image src={FACEBOOK} width={30} height={30} loading="lazy" className="w-[30px] h-auto" alt="Facebook" />
            <Image src={INSTARGRAM} width={30} height={30} loading="lazy" className="w-[30px] h-auto" alt="Instagram" />
            <Image src={PINTEREST} width={30} height={30} loading="lazy" className="w-[30px] h-auto" alt="Pinterest" />
            <Image src={TWITER} width={30} height={30} loading="lazy" className="w-[30px] h-auto" alt="Twitter" />
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