import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar/Sidebar";
import axios from "../api/axiosConfig";
import Cookies from "js-cookie";
import { FaUserCheck, FaUserTimes, FaSearch, FaSync, FaPlus } from "react-icons/fa";
import HeaderWithRole from "../Components/Hooks/HeaderWithRole";

export const UserControl = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New: state for modal & form
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER",
  });
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = Cookies.get("token");

      const res = await axios.get("/users/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(res.data.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = Cookies.get("token");

      const payload = {
        ...form,
        role: { name: `ROLE_${form.role.toUpperCase()}` }, // <-- wrap role string
      };

      await axios.post("/users/add", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("User created successfully!");
      setShowModal(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "USER",
      });
      fetchUsers();
    } catch (err) {
      console.error("Error creating user:", err);
      alert(err.response?.data?.message || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(term) ||
      u.firstName?.toLowerCase().includes(term) ||
      u.lastName?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleString() : "Never");

  const getRoleInfo = (role) => {
    const cleanRole = (role || "UNKNOWN").replace("ROLE_", "").toUpperCase();
    switch (cleanRole) {
      case "ADMIN":
        return { name: "ADMIN", bg: "bg-purple-100", text: "text-purple-800" };
      case "USER":
        return { name: "USER", bg: "bg-blue-100", text: "text-blue-800" };
      case "MODERATOR":
        return { name: "MOD", bg: "bg-yellow-100", text: "text-yellow-800" };
      default:
        return { name: cleanRole, bg: "bg-gray-100", text: "text-gray-700" };
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">User Management</h1>
          <div className="flex items-center gap-4">
            <HeaderWithRole />
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FaSync /> Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <FaPlus /> Add User
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl shadow mb-6 flex items-center gap-3">
          <FaSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search by email, name, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-2 outline-none"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading users...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found.</div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left">ID</th>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Last Login</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredUsers.map((u) => {
                  const { name, bg, text } = getRoleInfo(u.role);
                  return (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono">{u.id}</td>
                      <td className="px-6 py-4">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bg} ${text}`}
                        >
                          {name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.enabled ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <FaUserCheck /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <FaUserTimes /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">{formatDate(u.lastLogin)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 w-96">
              <h2 className="text-xl font-semibold mb-4">Add New User</h2>
              <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
                <input
                  name="firstName"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleInput}
                  className="p-2 border rounded-lg"
                  required
                />
                <input
                  name="lastName"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleInput}
                  className="p-2 border rounded-lg"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleInput}
                  className="p-2 border rounded-lg"
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleInput}
                  className="p-2 border rounded-lg"
                  required
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={handleInput}
                  className="p-2 border rounded-lg"
                  required
                />
                <select
                  name="role"
                  value={form.role}
                  onChange={handleInput}
                  className="p-2 border rounded-lg"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MODERATOR">Moderator</option>
                </select>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
