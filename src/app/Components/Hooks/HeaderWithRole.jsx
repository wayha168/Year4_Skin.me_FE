import useAuthContext from "../../Authentication/AuthContext";
import { FaUserShield, FaUser } from "react-icons/fa";

const HeaderWithRole = () => {
  const { user, isAdmin } = useAuthContext();

  if (!user) return null;

  const role = isAdmin() ? "ADMIN" : "USER";

  return (
    <div className="flex items-center gap-3 text-sm font-medium">
      <span className="text-gray-600">Welcome,</span>
      <span className="font-semibold text-gray-800">{user.firstName || user.email}</span>
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
          isAdmin() ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
        }`}
      >
        {isAdmin() ? <FaUserShield /> : <FaUser />} {role}
      </span>
    </div>
  );
};

export default HeaderWithRole;
