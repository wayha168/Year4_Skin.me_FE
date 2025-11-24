"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import axios from "../../api/axiosConfig";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import Loading from "../../Components/Loading/Loading";
import useUserActions from "../../Components/Hooks/userUserActions";
import { FaCartPlus, FaHeart } from "react-icons/fa";

const DefaultImage = "/assets/third_image.png";

/**
 * The main component that fetches and displays product details.
 * It uses useSearchParams, which requires a Suspense boundary.
 */
const ProductDetailsContent = () => {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addToCart, addToFavorite } = useUserActions();

  useEffect(() => {
    if (!productId) {
      setError("No product ID provided.");
      setLoading(false);
      return;
    }

    const fetchProductDetails = async () => {
      setLoading(true);
      setError("");
      try {
        // Let's try the most standard REST endpoint: /products/{id}
        const response = await axios.get(`/products/${productId}`);
        if (response.data && response.data.data) {
          setProduct(response.data.data);
        } else {
          // This handles cases where the API returns a 200 status but no data
          setError("Could not find product details.");
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("Could not load product details."); // This is the message you are seeing
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]); // Re-run the effect if the productId changes

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <p className="text-center text-red-500 text-lg mt-20">{error}</p>;
  }

  if (!product) {
    return <p className="text-center text-gray-500 text-lg mt-20">Product not found.</p>;
  }

  // Once product is loaded, display it
  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
      {/* Product Image */}
      <div>
        <Image
          src={
            product.images?.[0]?.downloadUrl
              ? `https://backend.skinme.store${product.images[0].downloadUrl}`
              : DefaultImage
          }
          alt={product.name}
          width={500}
          height={500}
          className="w-full h-auto object-cover rounded-lg shadow-lg"
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-gray-800">{product.name}</h1>
        <p className="text-3xl font-bold text-[#eb61a2]">${product.price}</p>
        <p className="text-gray-600 leading-relaxed">{product.description || "No description available."}</p>
        
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => addToCart(product.id, 1)}
            className="flex-1 bg-[#d13e82] text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 hover:bg-[#c32c70] hover:-translate-y-1"
          >
            <FaCartPlus /> Add to Cart
          </button>
          <button
            onClick={() => addToFavorite(product.id)}
            className="bg-white text-red-500 p-4 rounded-full shadow-lg transition-all duration-300 hover:bg-pink-100 hover:scale-110"
          >
            <FaHeart />
          </button>
        </div>
      </div>
    </div>
  );
};

// The main page component that sets up the structure and Suspense boundary
const ProductDetailsPage = () => {
  return (
    <>
      <Navbar alwaysVisible={true} />
      <main className="pt-36 pb-16 bg-white font-[Poppins,sans-serif] px-4">
        <Suspense fallback={<Loading />}>
          <ProductDetailsContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetailsPage;