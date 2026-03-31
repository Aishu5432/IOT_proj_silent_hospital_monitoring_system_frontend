import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaSave, FaBell, FaWifi, FaVideo, FaLock } from "react-icons/fa";
import toast from "react-hot-toast";
import { fetchBackendConfig, resetOccupancy } from "../services/api";
import {
  getSettings,
  saveSettings,
  subscribeSettings,
} from "../services/settingsService";

const Settings = () => {
  const [settings, setSettings] = useState(getSettings());
  const [backendConfig, setBackendConfig] = useState(null);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSettings((nextSettings) => {
      setSettings(nextSettings);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;

    const loadBackendConfig = async () => {
      try {
        const config = await fetchBackendConfig();
        if (active) setBackendConfig(config);
      } catch {
        if (active) setBackendConfig(null);
      }
    };

    loadBackendConfig();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    toast.success("Settings saved and applied successfully");
  };

  const handleResetOccupancy = async () => {
    try {
      setResetBusy(true);
      const result = await resetOccupancy();
      toast.success(result.message || "Occupancy reset completed");
    } catch {
      toast.error("Failed to reset occupancy");
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
        >
          <FaSave className="mr-2" /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaLock className="mr-2 text-blue-600" /> Threshold Configuration
          </h2>
          {Object.entries(settings.thresholds).map(([key, value]) => (
            <div key={key} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {key} Threshold
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    thresholds: {
                      ...prev.thresholds,
                      [key]: parseInt(event.target.value, 10),
                    },
                  }))
                }
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Current: {value}</span>
                <span>Max: 100</span>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaBell className="mr-2 text-yellow-600" /> Notification Preferences
          </h2>
          {Object.entries(settings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between mb-4">
              <span className="text-gray-700 capitalize">
                {key} Notifications
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        [key]: event.target.checked,
                      },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          ))}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaVideo className="mr-2 text-purple-600" /> Camera Configuration
          </h2>
          {Object.entries(settings.camera).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between mb-4">
              <span className="text-gray-700 capitalize">{key}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      camera: { ...prev.camera, [key]: event.target.checked },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          ))}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaWifi className="mr-2 text-green-600" /> Network Configuration
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WiFi SSID
              </label>
              <input
                type="text"
                value={settings.network.ssid}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    network: { ...prev.network, ssid: event.target.value },
                  }))
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MQTT Broker
              </label>
              <input
                type="text"
                value={settings.network.mqttBroker}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    network: {
                      ...prev.network,
                      mqttBroker: event.target.value,
                    },
                  }))
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Cloud Sync</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.network.cloudSync}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      network: {
                        ...prev.network,
                        cloudSync: event.target.checked,
                      },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaLock className="mr-2 text-gray-700" /> Backend Runtime Config
          </h2>

          {backendConfig ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                Fetch Interval: {backendConfig.fetch_interval_seconds}s
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                Entry Threshold: {backendConfig.entry_distance_threshold} cm
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                Clear Threshold: {backendConfig.entry_clear_distance_threshold}{" "}
                cm
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                Cooldown: {backendConfig.entry_cooldown_seconds}s
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                Crossing Window: {backendConfig.crossing_max_seconds}s
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                Crowd Alert Threshold: {backendConfig.crowd_alert_threshold}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Backend config unavailable.</p>
          )}

          <div className="mt-5">
            <button
              onClick={handleResetOccupancy}
              disabled={resetBusy}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              {resetBusy ? "Resetting..." : "Reset Estimated Occupancy"}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Settings;
