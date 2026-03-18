import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, Bar, LineChart, Line, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { 
  FaCalendar, 
  FaDownload, 
  FaChartPie,
  FaChartBar,
  FaChartLine 
} from 'react-icons/fa'

const Analytics = () => {
  const [chartType, setChartType] = useState('line')
  const [dateRange, setDateRange] = useState('week')

  // Mock analytics data
  const weeklyData = [
    { day: 'Mon', noise: 42, temp: 23, humidity: 55, alerts: 3 },
    { day: 'Tue', noise: 38, temp: 24, humidity: 58, alerts: 1 },
    { day: 'Wed', noise: 45, temp: 23, humidity: 52, alerts: 4 },
    { day: 'Thu', noise: 35, temp: 22, humidity: 60, alerts: 2 },
    { day: 'Fri', noise: 48, temp: 24, humidity: 54, alerts: 5 },
    { day: 'Sat', noise: 32, temp: 23, humidity: 62, alerts: 1 },
    { day: 'Sun', noise: 30, temp: 22, humidity: 63, alerts: 0 }
  ]

  const alertDistribution = [
    { name: 'Noise', value: 45, color: '#8b5cf6' },
    { name: 'Temperature', value: 30, color: '#ef4444' },
    { name: 'Humidity', value: 15, color: '#3b82f6' },
    { name: 'Crowd', value: 10, color: '#10b981' }
  ]

  const hourlyPattern = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    noise: Math.floor(Math.random() * 30) + 30,
    occupancy: Math.floor(Math.random() * 3)
  }))

  const stats = [
    { label: 'Total Alerts', value: '156', change: '+12%', color: 'text-red-600' },
    { label: 'Avg Noise', value: '38 dB', change: '-5%', color: 'text-green-600' },
    { label: 'Avg Temp', value: '23°C', change: '+1%', color: 'text-orange-600' },
    { label: 'Uptime', value: '99.9%', change: '+0.1%', color: 'text-green-600' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
        <div className="flex space-x-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <p className="text-gray-600 text-sm">{stat.label}</p>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
            <p className={`text-sm mt-2 ${stat.color}`}>{stat.change} from last period</p>
          </motion.div>
        ))}
      </div>

      {/* Chart Type Selector */}
      <div className="flex space-x-2 bg-white p-2 rounded-lg inline-block">
        <button
          onClick={() => setChartType('line')}
          className={`p-2 rounded ${chartType === 'line' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
        >
          <FaChartLine />
        </button>
        <button
          onClick={() => setChartType('bar')}
          className={`p-2 rounded ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
        >
          <FaChartBar />
        </button>
        <button
          onClick={() => setChartType('area')}
          className={`p-2 rounded ${chartType === 'area' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
        >
          <FaChartPie />
        </button>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environmental Trends */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Environmental Trends</h2>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' && (
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="noise" stroke="#8b5cf6" name="Noise (dB)" />
                <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#ef4444" name="Temperature (°C)" />
                <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidity (%)" />
              </LineChart>
            )}
            {chartType === 'bar' && (
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="noise" fill="#8b5cf6" name="Noise (dB)" />
                <Bar dataKey="temp" fill="#ef4444" name="Temperature (°C)" />
                <Bar dataKey="humidity" fill="#3b82f6" name="Humidity (%)" />
              </BarChart>
            )}
            {chartType === 'area' && (
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="noise" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                <Area type="monotone" dataKey="temp" stackId="2" stroke="#ef4444" fill="#ef4444" />
                <Area type="monotone" dataKey="humidity" stackId="3" stroke="#3b82f6" fill="#3b82f6" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </motion.div>

        {/* Alert Distribution */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Alert Distribution</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={alertDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {alertDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Hourly Pattern */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2"
        >
          <h2 className="text-xl font-semibold mb-4">Hourly Activity Pattern</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyPattern}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="noise" stroke="#8b5cf6" fill="#c4b5fd" name="Noise Level" />
              <Area yAxisId="right" type="monotone" dataKey="occupancy" stroke="#10b981" fill="#6ee7b7" name="Occupancy" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Analytics