import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar/Sidebar";
import Cookies from "js-cookie";
import axios from "../api/axiosConfig";
import { DollarSign, Package, TrendingUp, ShoppingCart } from "lucide-react";
import SummaryCard from "../Components/SummaryCard/SummaryCard";
import { useNavigate } from "react-router-dom";
import HeaderWithRole from "../Components/Hooks/HeaderWithRole";

const Dashboard = () => {
  const [salesRecords, setSalesRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("token");

        // Fetch sales records
        const resSales = await axios.get("/popular/sales", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSalesRecords(resSales.data.data || []);

        // Fetch orders
        const resOrders = await axios.get("/orders/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(resOrders.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Summary calculations
  const totalRevenue = salesRecords.reduce((sum, p) => sum + (p.price || 0) * (p.quantitySold || 0), 0);
  const totalQuantity = salesRecords.reduce((sum, p) => sum + (p.quantitySold || 0), 0);
  const totalProducts = salesRecords.length;

  // Count pending orders
  const pendingOrders = orders.filter((o) => o.orderStatus === "PENDING").length;

  // Pagination for product table
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = salesRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(salesRecords.length / itemsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 space-y-8 h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
          <HeaderWithRole />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          <div onClick={() => navigate("/sales")} className="cursor-pointer">
            <SummaryCard
              title="Total Revenue"
              value={`$${totalRevenue.toFixed(2)}`}
              icon={DollarSign}
              bgColor="bg-green-50"
            />
          </div>

          <SummaryCard title="Products Sold" value={totalQuantity} icon={Package} bgColor="bg-blue-50" />

          <SummaryCard
            title="Total Products"
            value={totalProducts}
            icon={TrendingUp}
            bgColor="bg-orange-50"
          />

          <SummaryCard
            title="Pending Orders"
            value={pendingOrders}
            icon={ShoppingCart}
            bgColor="bg-purple-50"
          />
        </div>

        {/* Product Sales Table */}
        <section className="bg-white shadow rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Product Summary</h2>

          {loading && <p className="text-gray-600">Loading product sales...</p>}
          {error && <p className="text-red-600">Error: {error}</p>}
          {!loading && !error && salesRecords.length === 0 && (
            <p className="text-gray-600">No product sales found.</p>
          )}

          {!loading && !error && salesRecords.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Product ID</th>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Price</th>
                    <th className="px-6 py-3 text-left">Quantity Sold</th>
                    <th className="px-6 py-3 text-left">Total Sale</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((product) => (
                    <tr key={product.productId} className="hover:bg-gray-50 border-t">
                      <td className="px-6 py-4">{product.productId}</td>
                      <td className="px-6 py-4 font-medium">{product.name}</td>
                      <td className="px-6 py-4">${product.price?.toFixed(2) || "N/A"}</td>
                      <td className="px-6 py-4">{product.quantitySold || 0}</td>
                      <td className="px-6 py-4 font-semibold">
                        ${(product.price * product.quantitySold || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
