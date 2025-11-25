"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaCartPlus, FaHeart } from "react-icons/fa";

const ThirdImage = "/assets/third_image.png";

const ProductCard = ({ product, onAddToCart, onFavorite }) => {
  const router = useRouter();

  return (
    <div className="product-card">
      <div className="product-img-container">
        <Image
          src={
            product?.images?.[0]?.downloadUrl
              ? `https://backend.skinme.store${product.images[0].downloadUrl}`
              : ThirdImage
          }
          alt={product.name || "Product Image"}
          width={400}
          height={400}
          className="product-img"
          onClick={() => router.push(`/product_details?productId=${product.id}`)}
        />
        <button className="favorite-btn" onClick={() => onFavorite(product.id)}>
          <FaHeart />
        </button>
      </div>

      <div className="product-info">
        <h3 className="product-name">{product?.name || "No Name"}</h3>
        <p className="product-desc">{product?.description || "No description"}</p>
        <p className="product-price">${product?.price ?? "N/A"}</p>
      </div>

      <button className="add-to-cart" onClick={() => onAddToCart(product.id)}>
        <FaCartPlus /> Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;