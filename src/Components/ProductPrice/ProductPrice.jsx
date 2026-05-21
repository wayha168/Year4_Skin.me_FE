"use client";

import React from "react";
import { formatPrice } from "../../app/lib/formatPrice";

const ProductPrice = ({ price, discountedPrice, className = "" }) => {
  const hasDiscount = discountedPrice != null && discountedPrice < (price ?? 0);

  if (hasDiscount) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="line-through text-gray-400 text-sm">
          {formatPrice(price)}
        </span>
        <span className="font-bold text-black text-sm">
          {formatPrice(discountedPrice)}
        </span>
      </div>
    );
  }

  return (
    <span className={`text-sm font-bold text-black ${className}`}>
      {formatPrice(price)}
    </span>
  );
};

export default ProductPrice;
