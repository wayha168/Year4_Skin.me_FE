import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar/Sidebar";
import axios from "../api/axiosConfig";
import { FaPlus, FaTrash } from "react-icons/fa";
import Cookies from "js-cookie";

const ImageCrud = () => {
  const [images, setImages] = useState([]);
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [files, setFiles] = useState(null);

  const token = Cookies.get("token");

  const fetchImages = async () => {
    try {
      const res = await axios.get("/images/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImages(res.data.data || []);
    } catch (error) {
      console.error("Error fetching images:", error.response?.data || error.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/products/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.data || []);
    } catch (error) {
      console.error("Error fetching products:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchProducts();
    fetchImages();
  }, [token]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files || !productId) return alert("Select a product and files");

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    formData.append("productId", productId);

    try {
      await axios.post("/images/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setFiles(null);
      setProductId("");
      fetchImages();
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await axios.delete(`/images/image/${id}/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchImages();
    } catch (error) {
      console.error("Delete failed:", error.response?.data || error.message);
    }
  };

  // Group images by product
  const groupedImages = images.reduce((acc, img) => {
    const key = img.product?.name || "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(img);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">Image Management</h1>

        {/* Upload Form */}
        <form
          onSubmit={handleUpload}
          className="bg-white p-6 rounded-2xl shadow-md mb-10 flex flex-col md:flex-row gap-4 items-center"
        >
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="border p-3 rounded-lg w-full md:w-1/3"
            required
          >
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="border p-3 rounded-lg w-full md:w-1/3"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center md:w-1/3"
          >
            <FaPlus /> Upload Images
          </button>
        </form>

        {/* Display Images grouped by Product */}
        {Object.entries(groupedImages).map(([productName, imgs]) => (
          <div key={productName} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{productName}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {imgs.map((img) => (
                <div key={img.imageId} className="border rounded-lg p-2 relative hover:shadow-lg transition">
                  <img
                    src={`https://backend.skinme.store${img.downloadUrl}`}
                    alt={img.fileName}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleDelete(img.imageId)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {images.length === 0 && <p className="text-center text-gray-500 mt-10">No images uploaded yet.</p>}
      </main>
    </div>
  );
};

export default ImageCrud;
