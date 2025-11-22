import Navbar from "../Components/Navbar/Navbar";
import Footer from "../Components/Footer/Footer";
// import MessageWidget from "../../Components/MessageWidget/MessageWidget";

const AboutUsPage = () => {
  const TeamImage = "/assets/second_image.png";
  return (
    <>
      <Navbar />
      <div className="flex flex-col md:flex-row justify-center items-center px-4 sm:px-8 md:px-16 py-24 bg-transparent min-h-screen gap-8">
        <div className="w-full md:w-[450px] text-center md:text-left">
          <h1 className="text-[#eb61a1] text-3xl sm:text-4xl md:text-[45px] font-bold mb-6 font-[Arial,Helvetica,sans-serif]">
            About SKIN.ME
          </h1>
          <p className="text-base sm:text-lg md:text-xl leading-[1.7] text-[#333] font-[Arial,Helvetica,sans-serif]">
            At SKIN.ME, we believe skincare should be simple, honest, and effective. We craft premium products
            from natural ingredients designed to enhance your skin's natural glow. Our mission is to redefine
            skincare by merging science with nature — so every product supports real confidence and beauty
            that lasts.
          </p>
        </div>
        <div className="w-full md:w-[450px]">
          <img 
            src={TeamImage} 
            alt="Team" 
            className="w-full rounded-[10px] shadow-[0_6px_20px_rgba(0,0,0,0.1)]"
          />
        </div>
      </div>
      <Footer />
      {/* <MessageWidget/> */}
    </>
  );
};

export default AboutUsPage;