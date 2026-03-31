import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaTemperatureHigh,
  FaUsers,
  FaBell,
  FaCheckCircle,
  FaChartLine,
  FaWifi,
  FaExclamationTriangle,
} from "react-icons/fa";
import { BsDropletHalf } from "react-icons/bs";
import { MdGraphicEq } from "react-icons/md";
import { fetchHistoricalSensorData } from "../services/api";
import { useAlerts, useSensorData } from "../context/AppContext";
import { getThresholdSettings } from "../services/settingsService";
import { formatDateTime, formatTime, getDataFreshness } from "../utils/helpers";
import Loader from "../components/Common/Loader";
import SensorCard from "../components/Dashboard/SensorCard";
import AlertCard from "../components/Dashboard/AlertCard";
import ChartComponent from "../components/Dashboard/ChartComponent";

const Dashboard = () => {
  const { sensorData, loading, error } = useSensorData();
  const { alerts } = useAlerts();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const resultCount =
          timeRange === "24h" ? 24 : timeRange === "7d" ? 7 * 24 : 30 * 24;
        const response = await fetchHistoricalSensorData({
          results: resultCount,
        });
        if (active) setHistory(response);
      } catch {
        if (active) setHistory([]);
      } finally {
        if (active) setHistoryLoading(false);
      }
    };

    loadHistory();
    return () => {
      active = false;
    };
  }, [timeRange]);

  const thresholds = getThresholdSettings();
  const freshness = getDataFreshness(sensorData.timestamp);

  const statsCards = useMemo(
    () => [
      {
        title: "Temperature",
        value: sensorData.temperature ?? 0,
        displayValue: `${sensorData.temperature ?? "--"}°C`,
        icon: <FaTemperatureHigh className="text-3xl" />,
        color: "from-orange-500 to-red-500",
        bgColor: "bg-orange-50",
        textColor: "text-orange-600",
        threshold: thresholds.temperature,
        unit: "°C",
      },
      {
        title: "Humidity",
        value: sensorData.humidity ?? 0,
        displayValue: `${sensorData.humidity ?? "--"}%`,
        icon: <BsDropletHalf className="text-3xl" />,
        color: "from-cyan-500 to-blue-500",
        bgColor: "bg-cyan-50",
        textColor: "text-cyan-600",
        threshold: thresholds.humidity,
        unit: "%",
      },
      {
        title: "Noise Level",
        value: sensorData.soundLevel ?? 0,
        displayValue: `${sensorData.soundLevel ?? "--"} dB`,
        icon: <MdGraphicEq className="text-3xl" />,
        color: "from-purple-500 to-pink-500",
        bgColor: "bg-purple-50",
        textColor: "text-purple-600",
        threshold: thresholds.soundLevel,
        unit: "dB",
      },
      {
        title: "People Count",
        value: sensorData.personCount ?? 0,
        displayValue: `${sensorData.personCount ?? "--"}`,
        icon: <FaUsers className="text-3xl" />,
        color: "from-green-500 to-emerald-500",
        bgColor: "bg-green-50",
        textColor: "text-green-600",
        threshold: thresholds.crowd,
        unit: "persons",
      },
    ],
    [sensorData, thresholds],
  );

  const chartData = history.map((item) => ({
    time: formatTime(item.timestamp),
    temperature: item.temperature ?? 0,
    humidity: item.humidity ?? 0,
    soundLevel: item.soundLevel ?? 0,
    personCount: item.personCount ?? 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Last Updated: {formatDateTime(sensorData.timestamp)}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3 py-2 rounded-lg bg-white shadow flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${freshness.dotClass}`}
            />
            <span className={`text-sm font-medium ${freshness.colorClass}`}>
              {freshness.label}
            </span>
          </div>
          {["24h", "7d", "30d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {(error || freshness.level === "stale") && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <FaExclamationTriangle className="text-red-500" />
          <p className="text-sm text-red-700">
            {error ||
              "Sensor stream is stale. Showing latest available data while trying to reconnect."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <SensorCard
            key={stat.title}
            {...stat}
            value={stat.displayValue}
            numericValue={stat.value}
            unit=""
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaChartLine className="mr-2 text-blue-600" /> Temperature Trend
          </h2>
          {historyLoading ? (
            <Loader compact label="Loading historical trend..." />
          ) : (
            <ChartComponent
              type="line"
              data={chartData}
              xKey="time"
              dataKey="temperature"
              label="Temperature (°C)"
              color="#ef4444"
              threshold={thresholds.temperature}
            />
          )}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <MdGraphicEq className="mr-2 text-purple-600" /> Noise Trend
          </h2>
          {historyLoading ? (
            <Loader compact label="Loading noise trend..." />
          ) : (
            <ChartComponent
              type="area"
              data={chartData}
              xKey="time"
              dataKey="soundLevel"
              label="Noise (dB)"
              color="#8b5cf6"
              threshold={thresholds.soundLevel}
            />
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaBell className="mr-2 text-yellow-600" /> Recent Alerts
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts
                .slice(0, 5)
                .map((alert) => <AlertCard key={alert.id} alert={alert} />)
            ) : (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <FaCheckCircle className="text-2xl mr-2 text-green-500" />
                No active alerts
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Data Source</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                {sensorData.source}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Data Freshness</span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${freshness.colorClass} bg-gray-100`}
              >
                {freshness.label}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Camera Status</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize">
                {sensorData.cameraStatus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Stream Health</span>
              <span
                className={`flex items-center text-sm ${loading ? "text-yellow-600" : "text-green-600"}`}
              >
                <FaWifi className="mr-1" /> {loading ? "Syncing" : "Stable"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
