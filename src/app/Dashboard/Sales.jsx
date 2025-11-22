import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import Sidebar from "../Components/Sidebar/Sidebar";
import Cookies from "js-cookie";
import axios from "../api/axiosConfig";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Sales = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonthlySales = async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get("/sales/monthly", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSalesData(res.data.data || []);
      } catch (err) {
        console.error("Error fetching monthly sales:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMonthlySales();
  }, []);

  const chartData = {
    labels: salesData.map((d) => d.month),
    datasets: [
      {
        label: "Monthly Revenue",
        data: salesData.map((d) => d.totalRevenue),
        backgroundColor: "rgba(34, 197, 94, 0.6)", // green
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 h-screen overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Monthly Sales</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow">
            <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Sales;
