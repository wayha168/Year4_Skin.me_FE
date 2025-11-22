import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig";
import Sidebar from "../Components/Sidebar/Sidebar";
import { FaPlus, FaEdit, FaTrash, FaImage, FaSync } from "react-icons/fa";
import Cookies from "js-cookie";

// Reusable Modal component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

const ProductCrud = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    price: "",
    productType: "",
    inventory: "",
    description: "",
    categoryId: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [imageFiles, setImageFiles] = useState(null);
  const token = Cookies.get("token");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchCategories();
    }
  }, [token]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/products/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/categories/all-categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openProductModal = (product = null) => {
    if (product) {
      setForm({ ...product, categoryId: product.category?.id || "" });
      setIsEditing(true);
      setEditingId(product.id);
    } else {
      setForm({
        name: "",
        brand: "",
        price: "",
        productType: "",
        inventory: "",
        description: "",
        howToUse: "",
        categoryId: "",
      });
      setIsEditing(false);
      setEditingId(null);
    }
    setShowProductModal(true);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        inventory: parseInt(form.inventory),
        category: { id: Number(form.categoryId) },
      };
      if (isEditing) {
        await axios.put(`/products/product/${editingId}/update`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("/products/add", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowProductModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`/products/product/${id}/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  // Image upload logic
  const openImageModal = (productId) => {
    setCurrentProductId(productId);
    setImageFiles(null);
    setImageModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!currentProductId || !imageFiles) return alert("Select images first");

    const formData = new FormData();
    Array.from(imageFiles).forEach((file) => formData.append("files", file));
    formData.append("productId", currentProductId);

    try {
      await axios.post("/images/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setImageModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProducts = products.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">Product Management</h1>
          <div className="flex gap-3">
            <button
              onClick={fetchProducts}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 active:scale-95 transition-all"
            >
              <FaSync className="animate-spin-slow" /> Refresh
            </button>
            <button
              onClick={() => openProductModal()}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 active:scale-95 transition-all"
            >
              <FaPlus /> Add Product
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-5 gap-6">
          {currentProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl p-5 transition-all flex flex-col items-center text-center"
            >
              <div className="mb-3">
                {p.images?.[0] ? (
                  <img
                    src={`https://backend.skinme.store${p.images[0].downloadUrl}`}
                    alt={p.images[0].fileName}
                    className="w-32 h-32 object-cover rounded-xl border"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center bg-gray-100 text-gray-400 rounded-xl border">
                    No image
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-gray-800 ">{p.name}</h3>
              <p className="text-sm text-gray-500">{p.brand}</p>
              <p className="text-blue-600 font-bold">${p.price}</p>
              <p className="text-gray-600 text-sm font-bold">{p.productType}</p>
              <p className="text-gray-600 text-sm">Inventory: {p.inventory}</p>
              <p className="text-gray-500 text-sm mb-2">Category: {p.category?.name || "N/A"}</p>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg p-2 transition"
                  title="Delete Product"
                >
                  <FaTrash />
                </button>
                <button
                  onClick={() => openProductModal(p)}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg p-2 transition"
                  title="Edit Product"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => openImageModal(p.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg p-2 transition"
                  title="Upload Images"
                >
                  <FaImage />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                currentPage === 1
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed border-gray-200"
                  : "text-blue-600 border-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500"
              }`}
            >
              ←
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-lg text-sm font-medium border transition-all ${
                  currentPage === i + 1
                    ? "bg-blue-500 text-white border-blue-500 shadow-sm scale-105"
                    : "text-gray-600 border-gray-200 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-400"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                currentPage === totalPages
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed border-gray-200"
                  : "text-blue-600 border-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500"
              }`}
            >
              →
            </button>
          </div>
        )}

        {/* Product Modal */}
        <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)}>
          <h2 className="text-xl font-semibold mb-4 text-center">
            {isEditing ? "Edit Product" : "Add Product"}
          </h2>
          <form onSubmit={handleSubmitProduct} className="grid gap-4">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Product Name"
              className="border p-2 rounded-lg"
              required
            />
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="Brand"
              className="border p-2 rounded-lg"
              required
            />
            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              type="number"
              placeholder="Price"
              className="border p-2 rounded-lg"
              required
            />
            <input
              name="productType"
              value={form.productType}
              onChange={handleChange}
              placeholder="Product Type"
              className="border p-2 rounded-lg"
            />
            <input
              name="inventory"
              value={form.inventory}
              onChange={handleChange}
              type="number"
              placeholder="Inventory"
              className="border p-2 rounded-lg"
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
              className="border p-2 rounded-lg resize-none"
            />
            <textarea
              name="description"
              value={form.howToUse}
              onChange={handleChange}
              placeholder="howToUse"
              className="border p-2 rounded-lg resize-none"
            />
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="border p-2 rounded-lg"
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              {isEditing ? "Update Product" : "Add Product"}
            </button>
          </form>
        </Modal>

        {/* Image Upload Modal */}
        <Modal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)}>
          <h2 className="text-xl font-semibold mb-4 text-center">Upload Images</h2>
          <form onSubmit={handleImageUpload} className="grid gap-4">
            <input
              type="file"
              multiple
              onChange={(e) => setImageFiles(e.target.files)}
              className="border p-2 rounded-lg"
            />
            <button
              type="submit"
              className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all"
            >
              <FaPlus /> Upload
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default ProductCrud;
