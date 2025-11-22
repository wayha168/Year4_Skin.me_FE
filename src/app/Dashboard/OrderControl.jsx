import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar/Sidebar";
import axios from "../api/axiosConfig";
import Cookies from "js-cookie";
import HeaderWithRole from "../Components/Hooks/HeaderWithRole";

export const OrderControl = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = Cookies.get("token");
      if (!token) {
        setError("Please log in to view orders.");
        return;
      }

      const res = await axios.get("/orders/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Backend returns: { message: "...", data: [...] }
      const fetchedOrders = res.data.data || [];
      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      if (err.response?.status === 403) {
        setError("Access denied. Admin role required.");
      } else if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError(err.response?.data?.message || "Failed to load orders.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter by userId or status
  const filteredOrders = orders.filter((o) => {
    const searchLower = search.toLowerCase();
    return (
      `User ${o.userId}`.toLowerCase().includes(searchLower) ||
      o.orderStatus?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex min-h-screen bg-gray-100 h-screen">
      <Sidebar />
      <main className="flex-1 p-8 h-screen overflow-y-auto">
        {/* ← NEW: Header with Role */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">All Orders</h1>
          <HeaderWithRole />
        </div>
        {/* Search */}
        <div className="bg-white p-4 rounded-2xl shadow mb-6">
          <input
            type="text"
            placeholder="Search by user ID or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading && <div className="p-8 text-center text-gray-600">Loading orders...</div>}

          {error && <div className="p-8 text-center text-red-600 font-medium">{error}</div>}

          {!loading && !error && filteredOrders.length === 0 && (
            <div className="p-8 text-center text-gray-500">No orders found.</div>
          )}

          {!loading && !error && filteredOrders.length > 0 && (
            <table className="min-w-full">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left">Order ID</th>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Total ($)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredOrders.map((o) => (
                  <tr key={o.orderId} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono">{o.orderId}</td>
                    <td className="px-6 py-4">User {o.userId}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          o.orderStatus === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : o.orderStatus === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">${parseFloat(o.totalAmount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};
