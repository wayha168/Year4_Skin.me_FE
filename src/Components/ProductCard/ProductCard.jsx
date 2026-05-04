"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaCartPlus, FaHeart } from "react-icons/fa";
import { getProductImageUrl } from "../../app/lib/productImage";
import { formatPrice } from "../../app/lib/formatPrice";

const ThirdImage = "/assets/third_image.png";

function getBrand(product) {
  if (typeof product?.brand === "string") return product.brand;
  return product?.brand?.name ?? "";
}

const ProductCard = ({ product, onAddToCart, onFavorite }) => {
  const router = useRouter();
  const brand = getBrand(product);
  const description = product?.description?.trim() || "No description";

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition-all duration-300">
      <div className="relative h-[200px] bg-gray-100">
        <Image
          src={getProductImageUrl(product, ThirdImage)}
          alt={product?.name || "Product"}
          fill
          className="object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
          sizes="(max-width: 600px) 50vw, 200px"
          unoptimized
          onClick={() => router.push(`/product_details?productId=${product.id}`)}
        />
        <button
          type="button"
          className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-[#e53e3e] hover:bg-red-50 transition-colors"
          onClick={() => onFavorite(product.id)}
        >
          <FaHeart className="text-sm" />
        </button>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-1 min-w-0 text-center">
        {brand && (
          <span className="opacity-70 text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
            {brand}
          </span>
        )}
        <h3 className="text-[1.15rem] font-bold text-gray-800 truncate" title={product?.name}>
          {product?.name || "No Name"}
        </h3>
        <p className="text-xs text-gray-500 truncate opacity-80" title={description}>
          {description}
        </p>
        <p className="text-sm font-bold text-black mt-1">
          {formatPrice(product?.price)}
        </p>
        <button
          type="button"
          className="mt-3 w-full bg-[#d13e82] text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#c32c70] transition-colors"
          onClick={() => onAddToCart(product.id)}
        >
          <FaCartPlus className="text-base" /> Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;