import { Link, useLocation } from "react-router-dom";
import {
  FaChartLine,
  FaBoxOpen,
  FaClipboardList,
  FaSignOutAlt,
  FaImages,
  FaTags,
  FaDollarSign,
  FaUsers,
  FaUserCheck,
} from "react-icons/fa";
import { SiHomepage } from "react-icons/si";
import useAuthContext from "../../Authentication/AuthContext"; // ← Import

const Sidebar = () => {
  const { pathname } = useLocation();
  const { logout } = useAuthContext(); // ← Get logout

  const linkClass = (path) =>
    `flex items-center gap-3 p-5 rounded-lg transition-all text-white ${
      pathname === path
        ? "bg-sky-200 text-blue-600 font-semibold shadow-lg" // ← Fixed: bg-white + dark text
        : "hover:bg-sky-500 hover:text-blue-600 text-white/90"
    }`;

  const handleLogout = async () => {
    await logout(); // ← Call real logout
  };

  return (
    <aside className="w-48 bg-gradient-to-b from-blue-600 to-blue-400 shadow-lg p-6 flex flex-col h-screen rounded-r-xl">
      <h2 className="text-2xl font-bold text-white mb-5 tracking-wider text-center">Skin.Me</h2>

      <nav className="flex flex-col gap-4 ">
        <Link to="/dashboard" className={linkClass("/dashboard")}>
          <FaChartLine /> <span>Dashboard</span>
        </Link>

        <Link to="/category-crud" className={linkClass("/category-crud")}>
          <FaTags /> <span>Categories</span>
        </Link>

        <Link to="/product-crud" className={linkClass("/product-crud")}>
          <FaBoxOpen /> <span>Products</span>
        </Link>

        <Link to="/order-control" className={linkClass("/order-control")}>
          <FaClipboardList /> <span>Orders</span>
        </Link>

        <Link to="/user-control" className={linkClass("/user-control")}>
          <FaUsers /> <span>Users</span>
        </Link>

        <Link to="/" className={linkClass("/homepage")}>
          <SiHomepage /> <span>Homepage</span>
        </Link>
      </nav>

      {/* Logout Button */}
      <div className="mt-auto pt-6">
        <button
          onClick={handleLogout} // ← Call logout()
          className="flex items-center gap-3 p-3 rounded-lg w-full bg-white text-red-600 font-semibold hover:shadow-lg transition"
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
