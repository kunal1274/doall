import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Settings, LogOut } from "lucide-react";

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Customer Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <LayoutDashboard className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">My Bookings</h3>
            <p className="text-gray-600">
              View and manage your service bookings
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <Users className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Find Services</h3>
            <p className="text-gray-600">
              Browse available services and providers
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <Settings className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Profile Settings</h3>
            <p className="text-gray-600">Update your account information</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <p className="text-gray-600">
            No recent bookings found. Start by browsing services!
          </p>
        </div>
      </div>
    </div>
  );
}
