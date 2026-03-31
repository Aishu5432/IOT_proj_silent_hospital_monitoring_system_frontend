import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAlerts } from "../context/AppContext";
import { FaFilter, FaTrash, FaCheckCircle } from "react-icons/fa";
import AlertCard from "../components/Dashboard/AlertCard";
import { fetchEntryLogs } from "../services/api";
import { formatDateTime } from "../utils/helpers";

const Alerts = () => {
  const { alerts, clearAlerts } = useAlerts();
  const [filter, setFilter] = useState("all");
  const [entryLogs, setEntryLogs] = useState([]);

  useEffect(() => {
    let active = true;

    const loadEntryLogs = async () => {
      try {
        const logs = await fetchEntryLogs({ limit: 20 });
        if (active) setEntryLogs(logs);
      } catch {
        if (active) setEntryLogs([]);
      }
    };

    loadEntryLogs();
    const timerId = setInterval(loadEntryLogs, 15_000);
    return () => {
      active = false;
      clearInterval(timerId);
    };
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.type === filter;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Alert History</h1>
        <div className="flex space-x-3">
          <button
            onClick={clearAlerts}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
          >
            <FaTrash className="mr-2" /> Clear All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center space-x-4">
          <FaFilter className="text-gray-500" />
          <span className="text-gray-700">Filter by:</span>
          {["all", "info", "warning", "critical"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg transition ${
                filter === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-12 rounded-xl shadow-lg text-center"
          >
            <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Alerts Found
            </h3>
            <p className="text-gray-600">All systems are operating normally</p>
          </motion.div>
        )}
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Entry Event Logs
        </h2>
        {entryLogs.length === 0 ? (
          <p className="text-sm text-gray-500">No entry events recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {entryLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2"
              >
                <span className="text-sm font-medium text-gray-700">
                  {log.event_type}
                </span>
                <span className="text-sm text-gray-500">
                  Distance: {log.distance ?? "N/A"}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Alerts;
