"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import MessageWidget from "../../Components/MessageWidget/MessageWidget";
import axios from "../../api/axiosConfig";
import Loading from "../../Components/Loading/Loading";

const ThirdImage = "/assets/third_image.png";

function ProductDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) {
      setError("No product specified.");
      setLoading(false);
      return;
    }

    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/products/${productId}`);
        const fetchedProduct = res.data.data;
        setProduct(fetchedProduct);

        // Fetch related products by brand
        if (fetchedProduct?.brand?.id) {
          const relatedRes = await axios.get(`/products/by-brand/${fetchedProduct.brand.id}`);
          setRelatedProducts(
            (relatedRes.data.data || []).filter((p) => p.id !== fetchedProduct.id)
          );
        }
      } catch (err) {
        console.error("Failed to fetch product details:", err);
        setError("Could not load product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => quantity > 1 && setQuantity((prev) => prev - 1);

  const handleCheckout = () => {
    const user = localStorage.getItem("user");
    if (!user) {
      alert("Please log in before checking out!");
      router.push("/login");
      return;
    }
    router.push(`/check_out?productId=${product.id}&quantity=${quantity}`);
  };

  return (
    <>
      <Navbar />

      <section className="flex flex-wrap justify-center gap-[50px] pt-[140px] px-10 pb-[60px] bg-[#fafafa] max-[900px]:flex-col max-[900px]:items-center">
        {loading && <Loading />}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {product && !loading && (
          <>
        {/* Product Images */}
        <div className="flex flex-col gap-[10px]">
          {product.images?.length ? (
            product.images.map((img, idx) => (
              <Image
                key={idx}
                src={`https://backend.skinme.store${img.downloadUrl}`}
                alt={product.name}
                width={350}
                height={350}
                className="w-[350px] h-[350px] rounded-2xl object-cover shadow-[0_2px_10px_rgba(0,0,0,0.15)] max-[900px]:w-[90vw] max-[900px]:h-auto"
              />
            ))
          ) : (
              <Image
                src={ThirdImage}
                alt="No image available"
                width={350}
                height={350}
                className="w-[350px] h-[350px] rounded-2xl object-cover shadow-[0_2px_10px_rgba(0,0,0,0.15)] max-[900px]:w-[90vw] max-[900px]:h-auto"
              />
          )}
        </div>

        {/* Product Info */}
        <div className="max-w-[450px] flex flex-col gap-4 max-[900px]:max-w-[90vw]">
          <h2 className="text-[2rem] font-semibold text-[#333]">{product.name}</h2>
          <p className="text-base text-[#777]">Brand: {product?.brand?.name || "Unknown"}</p>
          <p className="text-[1.8rem] text-[#eb61a2] font-bold">${(product.price * quantity).toFixed(2)}</p>

          {/* Quantity controls */}
          <div className="flex items-center gap-[10px] mt-[10px]">
            <button 
              onClick={decreaseQuantity} 
              disabled={quantity === 1}
              className="w-9 h-9 bg-[#eb61a2] text-white border-none rounded-lg text-[1.2rem] cursor-pointer disabled:bg-[#ccc] disabled:cursor-not-allowed"
            >
              -
            </button>
            <span className="text-[1.2rem] font-semibold">{quantity}</span>
            <button 
              onClick={increaseQuantity}
              className="w-9 h-9 bg-[#eb61a2] text-white border-none rounded-lg text-[1.2rem] cursor-pointer"
            >
              +
            </button>
          </div>

          <button 
            className="bg-[#ff4081] text-white py-3 px-5 border-none rounded-[10px] text-[1.1rem] cursor-pointer transition-colors duration-300 mt-[10px] hover:bg-[#e03774]" 
            onClick={handleCheckout}
          >
            Check Out
          </button>

          {/* Product Description */}
          <div className="mt-5">
            <h4 className="mb-[5px] text-[#444]">Description</h4>
            <p>{product.description || "No description available."}</p>
          </div>

          <p className="text-[#666] italic mt-[10px]">🌸 Made in Korea</p>
        </div>
        </>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-10 px-10 bg-white">
          <h3 className="text-[1.8rem] mb-5 text-[#333] text-center">More from {product?.brand?.name}</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
            {relatedProducts.map((item) => (
              <div
                key={item.id}
                className="bg-[#f9f9f9] rounded-xl p-3 text-center shadow-[0_1px_6px_rgba(0,0,0,0.1)] cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                onClick={() => router.push(`/product_detials?productId=${item.id}`)}
              >
                <Image
                  src={item.images?.[0]?.downloadUrl ? `https://backend.skinme.store${item.images[0].downloadUrl}` : ThirdImage}
                  width={180}
                  height={160}
                  alt={item.name}
                  className="w-full h-40 object-cover rounded-[10px]"
                />
                <p className="text-base mt-2 text-[#333]">{item.name}</p>
                <p className="text-[#eb61a2] font-semibold mt-1">${item.price}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
      <MessageWidget />
    </>
  );
}

export default ProductDetailsPage;