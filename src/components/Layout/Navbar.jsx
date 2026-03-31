import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaHospital,
  FaBell,
  FaUserCircle,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import { useAlerts } from "../../context/AppContext";
import { STORAGE_KEYS } from "../../utils/constants";

const Navbar = () => {
  const { alerts } = useAlerts();
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_KEYS.THEME) || "light",
  );
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  const unreadAlerts = alerts.filter((a) => !a.read).length;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <FaHospital className="text-3xl text-blue-600" />
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              SilentCare
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            {[
              "Dashboard",
              "Live Monitoring",
              "Analytics",
              "Alerts",
              "Documentation",
            ].map((item) => (
              <Link
                key={item}
                to={`/${item.toLowerCase().replace(" ", "-")}`}
                className={`relative px-3 py-2 text-sm font-medium transition ${
                  location.pathname ===
                  `/${item.toLowerCase().replace(" ", "-")}`
                    ? "text-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                {item}
                {location.pathname ===
                  `/${item.toLowerCase().replace(" ", "-")}` && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    initial={false}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 transition"
            >
              {theme === "light" ? (
                <FaMoon className="text-gray-600" />
              ) : (
                <FaSun className="text-yellow-500" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-gray-100 transition relative"
              >
                <FaBell className="text-gray-600" />
                {unreadAlerts > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadAlerts}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border"
                >
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {alerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition">
                <FaUserCircle className="text-2xl text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
