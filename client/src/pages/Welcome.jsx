import { Link } from "react-router-dom";
import { Home, Users, Wrench, Shield } from "lucide-react";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Welcome to DoAll Services
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Your one-stop platform for all service needs
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/login"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors border-2 border-white"
            >
              Sign Up
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              For Customers
            </h3>
            <p className="text-gray-600">
              Book services instantly, track providers in real-time, and manage
              all your needs in one place.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              For Providers
            </h3>
            <p className="text-gray-600">
              Accept bookings, manage your schedule, track earnings, and grow
              your business with us.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              For Admins
            </h3>
            <p className="text-gray-600">
              Manage platform operations, monitor services, handle disputes, and
              ensure quality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
