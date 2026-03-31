import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  FaDownload,
  FaChartPie,
  FaChartBar,
  FaChartLine,
} from "react-icons/fa";
import { fetchHistoricalSensorData } from "../services/api";
import { useAlerts } from "../context/AppContext";
import { formatTime, groupByHour } from "../utils/helpers";
import ChartComponent from "../components/Dashboard/ChartComponent";
import Loader from "../components/Common/Loader";

const RANGE_TO_RESULTS = {
  day: 24,
  week: 24 * 7,
  month: 24 * 30,
  year: 24 * 30,
};

const COLORS = ["#8b5cf6", "#ef4444", "#3b82f6", "#10b981"];

const Analytics = () => {
  const { alerts } = useAlerts();
  const [chartType, setChartType] = useState("line");
  const [dateRange, setDateRange] = useState("week");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      setLoading(true);
      try {
        const results = RANGE_TO_RESULTS[dateRange] || RANGE_TO_RESULTS.week;
        const data = await fetchHistoricalSensorData({ results });
        if (active) setHistory(data);
      } catch {
        if (active) setHistory([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadHistory();
    return () => {
      active = false;
    };
  }, [dateRange]);

  const chartRows = useMemo(
    () =>
      history.map((row) => ({
        label: formatTime(row.timestamp),
        temperature: row.temperature ?? 0,
        humidity: row.humidity ?? 0,
        soundLevel: row.soundLevel ?? 0,
        personCount: row.personCount ?? 0,
      })),
    [history],
  );

  const hourlyPattern = useMemo(() => groupByHour(history), [history]);

  const alertDistribution = useMemo(() => {
    const summary = alerts.reduce(
      (acc, alert) => {
        if (alert.metric === "soundLevel") acc.noise += 1;
        else if (alert.metric === "temperature") acc.temperature += 1;
        else if (alert.metric === "humidity") acc.humidity += 1;
        else if (alert.metric === "personCount") acc.crowd += 1;
        return acc;
      },
      { noise: 0, temperature: 0, humidity: 0, crowd: 0 },
    );

    return [
      { name: "Noise", value: summary.noise },
      { name: "Temperature", value: summary.temperature },
      { name: "Humidity", value: summary.humidity },
      { name: "Crowd", value: summary.crowd },
    ];
  }, [alerts]);

  const stats = useMemo(() => {
    const totalAlerts = alerts.length;
    const avgNoise = chartRows.length
      ? chartRows.reduce((sum, row) => sum + row.soundLevel, 0) /
        chartRows.length
      : 0;
    const avgTemp = chartRows.length
      ? chartRows.reduce((sum, row) => sum + row.temperature, 0) /
        chartRows.length
      : 0;

    return [
      {
        label: "Total Alerts",
        value: totalAlerts.toString(),
        color: "text-red-600",
      },
      {
        label: "Avg Noise",
        value: `${avgNoise.toFixed(1)} dB`,
        color: "text-purple-600",
      },
      {
        label: "Avg Temp",
        value: `${avgTemp.toFixed(1)}°C`,
        color: "text-orange-600",
      },
      {
        label: "Data Samples",
        value: history.length.toString(),
        color: "text-green-600",
      },
    ];
  }, [alerts.length, chartRows, history.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value)}
            className="px-4 py-2 bg-white rounded-lg border border-gray-300"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <FaDownload className="mr-2" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ scale: 1.03 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <p className="text-gray-600 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
            <p className={`text-sm mt-2 ${stat.color}`}>
              Live from ThingSpeak data
            </p>
          </motion.div>
        ))}
      </div>

      <div className="flex space-x-2 bg-white p-2 rounded-lg inline-block">
        <button
          onClick={() => setChartType("line")}
          className={`p-2 rounded ${chartType === "line" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
        >
          <FaChartLine />
        </button>
        <button
          onClick={() => setChartType("bar")}
          className={`p-2 rounded ${chartType === "bar" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
        >
          <FaChartBar />
        </button>
        <button
          onClick={() => setChartType("area")}
          className={`p-2 rounded ${chartType === "area" ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
        >
          <FaChartPie />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Environmental Trends</h2>
          {loading ? (
            <Loader compact label="Loading environmental trends..." />
          ) : (
            <ChartComponent
              type={chartType}
              data={chartRows}
              xKey="label"
              dataKey="temperature"
              label="Temperature (°C)"
              color="#ef4444"
              height={400}
            />
          )}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Alert Distribution</h2>
          {loading ? (
            <Loader compact label="Loading alert summary..." />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={alertDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={140}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  dataKey="value"
                >
                  {alertDistribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2"
        >
          <h2 className="text-xl font-semibold mb-4">
            Hourly Activity Pattern
          </h2>
          {loading ? (
            <Loader compact label="Loading hourly pattern..." />
          ) : (
            <ChartComponent
              type="area"
              data={hourlyPattern}
              xKey="hour"
              dataKey="soundLevel"
              label="Noise Level (dB)"
              color="#8b5cf6"
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Analytics;
