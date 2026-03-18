import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { 
  LineChart, Line, AreaChart, Area, 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts'
import { 
  FaTemperatureHigh, 
  FaVolumeUp, 
  FaUsers,
  FaBell,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChartLine
} from 'react-icons/fa'
import { BsDropletHalf } from 'react-icons/bs'
import SensorCard from '../components/Dashboard/SensorCard'
import AlertCard from '../components/Dashboard/AlertCard'

const Dashboard = () => {
  const { sensorData, alerts } = useApp()
  const [timeRange, setTimeRange] = useState('24h')

  // Mock historical data
  const historicalData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    noise: Math.floor(Math.random() * 30) + 30,
    temperature: Math.floor(Math.random() * 5) + 22,
    humidity: Math.floor(Math.random() * 20) + 40,
  }))

  const statsCards = [
    {
      title: 'Temperature',
      value: `${sensorData.temperature}°C`,
      icon: <FaTemperatureHigh className="text-3xl" />,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      threshold: 28,
      unit: '°C'
    },
    {
      title: 'Humidity',
      value: `${sensorData.humidity}%`,
      icon: <BsDropletHalf className="text-3xl" />,
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
      threshold: 70,
      unit: '%'
    },
    {
      title: 'Noise Level',
      value: `${sensorData.noise} dB`,
      icon: <FaVolumeUp className="text-3xl" />,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      threshold: 50,
      unit: 'dB'
    },
    {
      title: 'People Count',
      value: sensorData.crowd,
      icon: <FaUsers className="text-3xl" />,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      threshold: 2,
      unit: 'persons'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex space-x-2">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <SensorCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature & Humidity Chart */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaChartLine className="mr-2 text-blue-600" />
            Temperature & Humidity Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="temperature" 
                stroke="#ef4444" 
                name="Temperature (°C)"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="humidity" 
                stroke="#3b82f6" 
                name="Humidity (%)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Noise Level Chart */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaVolumeUp className="mr-2 text-purple-600" />
            Noise Level Monitoring
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="noise" 
                stroke="#8b5cf6" 
                fill="#c4b5fd" 
                name="Noise (dB)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaBell className="mr-2 text-yellow-600" />
            Recent Alerts
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.slice(0, 5).map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))
            ) : (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <FaCheckCircle className="text-2xl mr-2 text-green-500" />
                No active alerts
              </div>
            )}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Raspberry Pi</span>
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                Online
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sensors</span>
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                4 Active
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">WiFi Connection</span>
              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                Strong
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cloud Sync</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                Real-time
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Update</span>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Threshold Status */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Threshold Status</h3>
            {statsCards.map((stat, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>{stat.title}</span>
                  <span className={stat.value > stat.threshold ? 'text-red-600' : 'text-green-600'}>
                    {stat.value} / {stat.threshold}{stat.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      (stat.title === 'Temperature' && 'bg-gradient-to-r from-orange-500 to-red-500') ||
                      (stat.title === 'Humidity' && 'bg-gradient-to-r from-cyan-500 to-blue-500') ||
                      (stat.title === 'Noise Level' && 'bg-gradient-to-r from-purple-500 to-pink-500') ||
                      (stat.title === 'People Count' && 'bg-gradient-to-r from-green-500 to-emerald-500')
                    }`}
                    style={{ 
                      width: `${(parseFloat(stat.value) / stat.threshold) * 100}%`,
                      maxWidth: '100%'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Dashboard