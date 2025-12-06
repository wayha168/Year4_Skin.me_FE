"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Navbar from "../../../Components/Navbar/Navbar";
import Footer from "../../../Components/Footer/Footer";
import useAuthContext from "../../../app/lib/Authentication/AuthContext";
import { FaUser, FaEnvelope, FaCalendarAlt, FaUserCircle } from "react-icons/fa";
import Loading from "../../../Components/Loading/Loading";
import axiosAuth from "../../../app/lib/api/axiosConfig";

import MessageWidget from "../../../Components/MessageWidget/MessageWidget";

const ProfilePage = () => {
  const { user: authUser } = useAuthContext();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await axiosAuth.get(`/users/${authUser.id}/user`);
        setUser(response.data.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [authUser]);

  if (!authUser) return <Loading />;

  if (loading) return <Loading />;

  if (error)
    return (
      <>
        <Navbar alwaysVisible={true} />
        <div className="text-center py-10 text-red-600 font-semibold">{error}</div>
        <Footer />
      </>
    );

  // Add a check for user data before rendering the main content
  if (!user) {
    return (
      <>
        <Navbar alwaysVisible={true} />
        <div className="text-center py-10 text-gray-500">Loading user profile...</div>
        <Footer />
      </>
    );
  }
  return (
    <>
      <Navbar alwaysVisible={true} />

      {/* Wrapper */}
      <main className="flex justify-center items-center min-h-screen bg-gray-100 p-5">
        {/* Card */}
        <div className="bg-white rounded-[15px] shadow-lg p-10 max-w-[400px] w-full text-center">
          {/* Avatar */}
          <div className="flex justify-center mb-5">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt="avatar"
                width={150}
                height={150}
                className="rounded-full object-cover bg-pink-100"
              />
            ) : (
              <div className="w-[150px] h-[150px] rounded-full bg-pink-100 flex items-center justify-center">
                <FaUserCircle size={150} color="#eb61a2" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h2 className="text-[1.6rem] font-semibold flex justify-center items-center gap-2">
              <FaUser className="text-green-600" />
              {user.firstName} {user.lastName}
            </h2>

            <p className="text-gray-600 flex justify-center items-center gap-2">
              <FaEnvelope className="text-green-600" /> {user.email}
            </p>

            <p className="text-gray-600 flex justify-center items-center gap-2">
              <FaCalendarAlt className="text-green-600" /> Joined:{" "}
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-around">
            <button className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Edit Profile
            </button>

            <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Change Password
            </button>
          </div>
        </div>
      </main>

      <Footer />
      <MessageWidget />
    </>
  );
};

export default ProfilePage;
