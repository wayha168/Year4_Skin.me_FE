import { useState } from "react";
import axios from "../../api/axiosConfig";
import useAuthContext from "../../Authentication/AuthContext";

const useUserActions = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      setMessage("Please log in to add to cart");
      return false;
    }

    try {
      setLoading(true);
      await axios.post(`/cartItems/item/add`, null, {
        params: { productId, quantity },
        withCredentials: true,
      });

      setMessage("Added to your cart");
      return true;
    } catch (err) {
      console.error("Error adding to cart:", err);
      setMessage(err.response?.data?.message || "Failed to add to cart");
      return false;
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const addToFavorite = async (productId) => {
    if (!user) {
      setMessage("Please log in to add favorite");
      return false;
    }

    try {
      setLoading(true);
      await axios.post(`/favorites/add`, null, {
        params: { userId: user.id, productId },
        withCredentials: true,
      });

      setMessage("Added to your favorites");
      return true;
    } catch (err) {
      console.error("Error adding to favorite:", err);
      setMessage(err.response?.data?.message || err.response?.data?.error || "Failed to add to favorite");
      return false;
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const removeFavorite = async (productId) => {
    if (!user) {
      setMessage("Please log in to remove favorite");
      return false;
    }

    try {
      setLoading(true);
      await axios.delete(`/favorites/remove`, {
        params: { userId: user.id, productId },
        withCredentials: true,
      });
      setMessage("Removed from favorites");
      return true;
    } catch (err) {
      console.error("Error removing favorite:", err);
      setMessage(err.response?.data?.message || err.response?.data?.error || "Failed to remove favorite");
      return false;
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 2000);
    }
  };

  return {
    addToCart,
    addToFavorite,
    removeFavorite,
    loading,
    message,
  };
};

export default useUserActions;
