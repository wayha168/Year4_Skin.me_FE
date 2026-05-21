"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import useAuthContext from "../../../app/lib/Authentication/AuthContext";
import {
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaUserCircle,
  FaSignOutAlt,
  FaHeart,
  FaShoppingBag,
  FaMapMarkerAlt,
  FaCartPlus,
} from "react-icons/fa";
import Loading from "../../../Components/Loading/Loading";
import axiosAuth from "../../../app/lib/api/axiosConfig";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";
import { getProductImageUrl } from "../../../app/lib/productImage";
import { formatPrice } from "../../../app/lib/formatPrice";
import useUserActions from "../../../Components/Hooks/userUserActions";
import { useRouter } from "next/navigation";

const DefaultProductImage = "/assets/third_image.png";

const ProfilePage = () => {
  const { user: authUser, logout } = useAuthContext();
  const router = useRouter();
  const { addToCart, addToFavorite } = useUserActions();
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  const userId = authUser?.id;

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await axiosAuth.get(`/users/${userId}/user`);
      setUser(response.data?.data ?? response.data);
    } catch (err) {
      console.error(err);
      setUser(null);
    }
  }, [userId]);

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await axiosAuth.get(`/favorites/user/${userId}`, {
        withCredentials: true,
      });
      setFavorites(data?.data || []);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setFavorites([]);
        return;
      }
      setFavorites([]);
    }
  }, [userId]);

  const fetchOrders = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axiosAuth.get("/orders/all", { withCredentials: true });
      const allOrders = res.data?.data || [];
      const myOrders = allOrders.filter((o) => Number(o.userId) === Number(userId));
      setOrders(myOrders);
    } catch {
      setOrders([]);
    }
  }, [userId]);

  const handleRemoveFavorite = useCallback(
    async (productId) => {
      if (!userId) return;
      try {
        await axiosAuth.delete("/favorites/remove", {
          params: { userId, productId },
          withCredentials: true,
        });
        setFavorites((prev) => prev.filter((f) => f.product?.id !== productId));
        setNotification("Removed from favorites");
        setTimeout(() => setNotification(""), 2000);
      } catch (err) {
        console.error("Error removing favorite:", err);
        setNotification("Failed to remove favorite");
        setTimeout(() => setNotification(""), 3000);
      }
    },
    [userId]
  );

  const handleAddToCartFromFavorite = useCallback(async (productId) => {
    await addToCart(productId, 1);
  }, [addToCart]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setError("");
    setLoading(true);
    Promise.allSettled([fetchUser(), fetchFavorites(), fetchOrders()]).then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId, fetchUser, fetchFavorites, fetchOrders]);

  const displayUser = user || authUser;

  if (!authUser) return <Loading />;

  if (loading && !displayUser) return <Loading />;

  if (error && !displayUser) {
    return (
      <>
        <Navbar alwaysVisible={true} />
        <div className="min-h-screen bg-gray-100 pt-14 sm:pt-24 pb-20 sm:pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center py-10 text-red-600 font-semibold">{error}</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar alwaysVisible={true} />
      <main className="pt-[5rem] px-0 pb-16 bg-[#F7F7F7] font-[Poppins,sans-serif]">
        {/* ===== Hero Section ===== */}
        <div className="w-full mb-[1rem] -mt-[4.5rem]">
          <h1 className="mt-[12px] w-full h-[9rem] flex items-end justify-center max-[750px]:justify-end text-4xl font-bold bg-[#F7F7F7] text-[#EB61A2] pb-[13px] max-[750px]:pr-4 max-[750px]:text-[1.8rem]">
            Profile
          </h1>
        </div>

        <div className="px-4 sm:px-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold opacity-70 text-[#000000]">My Account</h1>

          {/* 1. User Info Card */}
          <section className="bg-[#ffffff] rounded-2xl shadow-md overflow-hidden">
            <div className="bg-[#1B1B1B] px-6 py-4 border-b border-[#333]">
              <h2 className="text-lg font-semibold text-[#EFEFEF] flex items-center gap-2">
                <FaUser className="text-[#ffffff]" />
                User Information
              </h2>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="flex-shrink-0">
                {displayUser?.avatar ? (
                  <Image
                    src={displayUser.avatar}
                    alt="Avatar"
                    width={100}
                    height={100}
                    className="rounded-full object-cover bg-pink-100 w-24 h-24"
                    unoptimized
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#FF85BB] flex items-center justify-center">
                    <FaUserCircle size={56} className="text-[#ffffff]" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <p className="text-gray-800 font-semibold text-lg">
                  {displayUser?.firstName} {displayUser?.lastName}
                </p>
                <p className="text-gray-600 flex items-center justify-center sm:justify-start gap-2">
                  <FaEnvelope className="text-[#eb61a2] text-sm" />
                  {displayUser?.email}
                </p>
                <p className="text-gray-500 text-sm flex items-center justify-center sm:justify-start gap-2">
                  <FaCalendarAlt className="text-[#eb61a2] text-sm" />
                  Joined: {displayUser?.createdAt
                    ? new Date(displayUser.createdAt).toLocaleDateString()
                    : "—"}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
                  <button className="px-4 py-2 border-2 border-[#eb61a2] text-[#eb61a2] text-sm font-medium rounded-lg hover:bg-[#eb61a2] hover:text-white transition">
                    Edit Profile
                  </button>
                  <button className="px-4 py-2 bg-[#eb61a2] text-white text-sm font-medium rounded-lg hover:bg-transparent hover:border-2 hover:border-[#eb61a2] hover:text-[#eb61a2] transition">
                    Change Password
                  </button>
                  <button
                    onClick={logout}
                    className="ml-auto px-4 py-2 bg-[#D80004] text-white text-sm font-medium rounded-lg hover:bg-[#b00003] transition flex items-center gap-2"
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Favorites Card */}
          <section className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-[#1B1B1B] px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-[#EFEFEF] flex items-center gap-2">
                <FaHeart className="text-[#EFEFEF]" />
                My Favorites
              </h2>
              <Link
                href="/favorites"
                className="text-sm font-medium text-[#eb61a2] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="p-6">
              {notification && (
                <div className="mb-3 text-center text-sm text-white bg-[#eb61a2] rounded px-3 py-1">
                  {notification}
                </div>
              )}
              {loading ? (
                <p className="text-gray-500 text-center py-6">
                  <i className="fa fa-spinner fa-spin mr-2" />
                  Loading favorites...
                </p>
              ) : favorites.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No favorites yet. Add products from the shop!</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {favorites.slice(0, 8).map((fav) => {
                    const product = fav?.product;
                    if (!product) return null;

                    const imgSrc = fav?.productThumbnailUrl
                      ? (fav.productThumbnailUrl.startsWith("http")
                        ? fav.productThumbnailUrl
                        : fav.productThumbnailUrl.startsWith("/")
                        ? fav.productThumbnailUrl
                        : `/${fav.productThumbnailUrl}`)
                      : getProductImageUrl(product, DefaultProductImage);

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] z-[100]"
                      >
                        <div className="relative h-[160px] bg-gray-100">
                          <Image
                            src={imgSrc}
                            alt={product.name || "Product"}
                            fill
                            className="object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                            unoptimized
                            onClick={() => router.push(`/product_details?productId=${product.id}`)}
                            onError={(e) => (e.currentTarget.src = DefaultProductImage)}
                          />
                        </div>

                        <div className="flex flex-col flex-1 p-3 gap-1 min-w-0 text-center">
                          {product.brand && (
                            <span className="opacity-70 text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
                              {typeof product.brand === "object" ? product.brand?.name : product.brand}
                            </span>
                          )}
                          <h3
                            className="text-[1.05rem] font-bold text-gray-800 truncate cursor-pointer"
                            onClick={() => router.push(`/product_details?productId=${product.id}`)}
                          >
                            {product.name}
                          </h3>
                          <p className="text-sm font-bold text-black mt-1">
                            {formatPrice(product.price)}
                          </p>

                          <button
                            type="button"
                            onClick={() => handleAddToCartFromFavorite(product.id)}
                            className="mt-2 w-full bg-[#d13e82] text-white text-sm font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#c32c70] transition-colors"
                          >
                            <FaCartPlus className="text-sm" /> Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* 3. Order History & Address Card */}
          <section className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-[#1B1B1B] px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-[#EFEFEF] flex items-center gap-2">
                <FaShoppingBag className="text-[#EFEFEF]" />
                Order History & Address
              </h2>
              <Link
                href="/bag_page"
                className="text-sm font-medium text-[#eb61a2] hover:underline"
              >
                Go to Bag
              </Link>
            </div>
            <div className="p-6 space-y-6">
              {/* Delivery address (summary) */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <FaMapMarkerAlt className="text-[#eb61a2]" />
                  Delivery Address
                </h3>
                <p className="text-gray-600 text-sm">
                  Your delivery address will be set at checkout when you place an order.
                </p>
                <Link
                  href="/check_out"
                  className="inline-block mt-2 text-sm font-medium text-[#eb61a2] hover:underline"
                >
                  Set address at checkout →
                </Link>
              </div>

              {/* Order history list */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Orders</h3>
                {loading ? (
                  <p className="text-gray-500 text-sm py-2">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="text-gray-500 text-sm py-2">No orders yet.</p>
                ) : (
                   <ul className="space-y-2">
                     {orders.slice(0, 10).map((o, index) => (
                       <li
                         key={o.orderId ?? o.id ?? Math.random()}
                         className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 bg-gray-50 rounded-lg text-sm"
                       >
                         <span className="font-mono text-gray-700">
                           #{index + 1} — {displayUser?.email || "—"}
                         </span>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            (o.orderStatus || "").toLowerCase() === "delivered"
                              ? "bg-green-100 text-green-800"
                              : (o.orderStatus || "").toLowerCase() === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {o.orderStatus ?? "—"}
                        </span>
                        <span className="font-semibold text-[#eb61a2]">
                          {formatPrice(o.totalAmount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
         </div>
        </div>
      </main>
      <Footer />
      <MessageWidget />
    </>
  );
};

export default ProfilePage;
