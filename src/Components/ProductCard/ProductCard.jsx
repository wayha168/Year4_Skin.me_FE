import React from "react";
import { useNavigate } from "react-router-dom";
import { FaCartPlus, FaHeart } from "react-icons/fa";
import ThirdImage from "../../assets/third_image.png";

const ProductCard = ({ product, onAddToCart, onFavorite }) => {
  const navigate = useNavigate();

  return (
    <div className="product-card">
      <div className="product-img-container">
        <img
          src={
            product?.images?.[0]?.downloadUrl
              ? `https://backend.skinme.store${product.images[0].downloadUrl}`
              : ThirdImage
          }
          alt={product.name || "Product Image"}
          className="product-img"
          onClick={() => navigate("/product_details", { state: { product } })}
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
