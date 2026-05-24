"use client";

import React from "react";
import { formatPrice } from "../../app/lib/formatPrice";

const ProductPrice = ({ 
  price, 
  discountedPrice, 
  className = "", 
  originalClassName = "line-through text-gray-400 text-sm",
  discountedClassName = "font-bold text-black text-sm",
  priceClassName = "text-sm font-bold text-black",
  centered = false
}) => {
  const hasDiscount = discountedPrice != null && discountedPrice < (price ?? 0);

  if (hasDiscount) {
    const wrapperClass = centered
      ? `flex items-center justify-center gap-2 ${className}`
      : `inline-flex items-center gap-2 ${className}`;
    return (
      <div className={wrapperClass}>
        <span className={originalClassName}>
          {formatPrice(price)}
        </span>
        <span className={discountedClassName}>
          {formatPrice(discountedPrice)}
        </span>
      </div>
    );
  }

  return (
    <span className={`${priceClassName} ${className}`}>
      {formatPrice(price)}
    </span>
  );
};

export default ProductPrice;
