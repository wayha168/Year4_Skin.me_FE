"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import axios from "../..//app/lib/api/axiosConfig";
import useAuthContext from "../../app/lib/Authentication/AuthContext";

function getErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  return data.message ?? data.error ?? data.msg ?? fallback;
}

const useUserActions = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      toast.error("Please log in to add to cart");
      return false;
    }

    const productIdNum = Number(productId);
    const quantityNum = Number(quantity) || 1;
    if (!productIdNum) {
      toast.error("Invalid product");
      return false;
    }

    try {
      setLoading(true);
      const body = { productId: productIdNum, quantity: quantityNum };
      await axios.post(`/cartItems/item/add`, body, {
        params: { productId: productIdNum, quantity: quantityNum },
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      toast.success("Added to your cart");
      return true;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to add to cart");
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addToFavorite = async (productId) => {
    if (!user) {
      toast.error("Please log in to add to favorites");
      return false;
    }

    const userId = Number(user.id);
    const productIdNum = Number(productId);
    if (!userId || !productIdNum) {
      toast.error("Invalid user or product");
      return false;
    }

    try {
      setLoading(true);
      const body = { userId, productId: productIdNum };
      await axios.post(`/favorites/add`, body, {
        params: { userId, productId: productIdNum },
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      toast.success("Added to your favorites");
      return true;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to add to favorites");
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (productId) => {
    if (!user) {
      toast.error("Please log in to remove from favorites");
      return false;
    }

    const userId = Number(user.id);
    const productIdNum = Number(productId);

    try {
      setLoading(true);
      await axios.delete(`/favorites/remove`, {
        params: { userId, productId: productIdNum },
        withCredentials: true,
      });
      toast.success("Removed from favorites");
      return true;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to remove from favorites");
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
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
