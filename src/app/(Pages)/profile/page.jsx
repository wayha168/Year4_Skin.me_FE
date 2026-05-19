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
} from "react-icons/fa";
import Loading from "../../../Components/Loading/Loading";
import axiosAuth from "../../../app/lib/api/axiosConfig";
import MessageWidget from "../../../Components/MessageWidget/MessageWidget";
import { getProductImageUrl } from "../../../app/lib/productImage";
import { formatPrice } from "../../../app/lib/formatPrice";

const DefaultProductImage = "/assets/third_image.png";

const ProfilePage = () => {
  const { user: authUser, logout } = useAuthContext();
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      const { data } = await axiosAuth.get(`/favorites/users/${userId}`, {
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
                <FaUser className="text-[#eb61a2]" />
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
                  <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center">
                    <FaUserCircle size={56} className="text-[#eb61a2]" />
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
                  <button className="px-4 py-2 bg-[#eb61a2] text-white text-sm font-medium rounded-lg hover:bg-[#d0578f] transition">
                    Edit Profile
                  </button>
                  <button className="px-4 py-2 border-2 border-[#eb61a2] text-[#eb61a2] text-sm font-medium rounded-lg hover:bg-[#eb61a2] hover:text-white transition">
                    Change Password
                  </button>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
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
                      <Link
                        key={product.id}
                        href={`/product_details?productId=${product.id}`}
                        className="group block bg-gray-50 rounded-xl p-3 hover:shadow-md transition"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 mb-2">
                          <Image
                            src={imgSrc}
                            alt={product.name || "Product"}
                            width={120}
                            height={120}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                            unoptimized
                            onError={(e) => (e.target.src = DefaultProductImage)}
                          />
                        </div>
                        <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                        <p className="text-xs text-[#eb61a2] font-semibold">
                          ${Number(product.price ?? 0).toFixed(2)}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* 3. Order History & Address Card */}
          <section className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-[#eb61a2]/10 to-[#ffd0ed]/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaShoppingBag className="text-[#eb61a2]" />
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
                    {orders.slice(0, 10).map((o) => (
                      <li
                        key={o.orderId ?? o.id ?? Math.random()}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 bg-gray-50 rounded-lg text-sm"
                      >
                        <span className="font-mono text-gray-700">
                          #{o.orderId ?? o.id ?? "—"}
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
