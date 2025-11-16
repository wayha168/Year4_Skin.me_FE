
// FavoritePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosConfig";
import "./FavoritePage.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import useAuthContext from "../../Authentication/AuthContext";
import ThirdImage from "../../assets/third_image.png";
import MessageWidget from "../../Components/MessageWidget/MessageWidget";

const FavoritePage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  const { user } = useAuthContext();
  const navigate = useNavigate();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      navigate("/login", {
        state: { redirectTo: "/favorites", showLoginPopup: true },
      });
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        const { data } = await axios.get(`/favorites/user/${userId}`, {
          withCredentials: true,
        });
        setFavorites(data?.data || []);
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setNotification("Failed to load favorites");
        setTimeout(() => setNotification(""), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [userId]);

  const handleRemoveFavorite = async (productId) => {
    if (!userId) return;

    try {
      await axios.delete("/favorites/remove", {
        params: { userId, productId },
        withCredentials: true,
      });

      setFavorites((prev) => prev.filter((f) => f.product.id !== productId));
      setNotification("Removed from favorites");
      setTimeout(() => setNotification(""), 2000);
    } catch (err) {
      console.error("Error removing favorite:", err);
      setNotification("Failed to remove favorite");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const handleProductClick = (productId) => {
    navigate("/check_out", { state: { productId } });
  };

  /** Build a safe image URL like BagPage */
  const getProductImage = (fav) => {
    const imageUrl = fav?.productThumbnailUrl || fav?.product?.images?.[0]?.downloadUrl;

    return imageUrl
      ? `https://backend.skinme.store${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`
      : ThirdImage;
  };

  return (
    <>
      <Navbar />

      {/* Notification toast */}
      {notification && <div className="remove_bag_alert">{notification}</div>}

      <section className="products-section h-auto min-h-screen py-8 px-4 bg-gray-100">
        <div className="products-favorite">
          <h1 className="favorite-title">My Favorites</h1>
        </div>

        {/* Loading */}
        {loading ? (
          <p className="loading text-center">
            <i className="fa fa-spinner fa-spin mr-2" />
            Loading your favorites...
          </p>
        ) : favorites.length === 0 ? (
          <p className="loading text-center">You have no favorite products yet.</p>
        ) : (
          <div className="products-grid">
            {favorites.map((fav) => {
              const product = fav.product;
              if (!product) return null;

              return (
                <div className="product-card" key={product.id}>
                  {/* Product Image */}
                  <div
                    className="product-img-container cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <img
                      src={getProductImage(fav)}
                      alt={product.name}
                      className="product-img"
                      loading="lazy"
                      onError={(e) => (e.currentTarget.src = ThirdImage)}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-brand">{product.brand}</p>
                    <p className="product-description">
                      {product.description || "No description available."}
                    </p>
                    <p className="product-price">${Number(product.price ?? 0).toFixed(2)}</p>
                  
                    <div className="add_to_card_and_remove">
                      <p
                        className="remove_favorite"
                        onClick={() => handleRemoveFavorite(product.id)}
                        title="Remove from favorites"
                      >
                        <i className="fa-solid fa-trash" />
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
      <MessageWidget />
    </>
  );
};

export default FavoritePage;
