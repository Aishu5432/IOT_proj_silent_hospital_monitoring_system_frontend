import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FaSave, FaBell, FaWifi, FaVideo, FaUser, FaLock } from 'react-icons/fa'
import toast from 'react-hot-toast'

const Settings = () => {
  const [settings, setSettings] = useState({
    thresholds: {
      noise: 50,
      temperature: 28,
      humidity: 70,
      crowd: 2
    },
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    camera: {
      enabled: true,
      motionDetection: true,
      recording: false
    },
    network: {
      ssid: 'Hospital_WiFi',
      mqttBroker: 'mqtt.hospital.local',
      cloudSync: true
    }
  })

  const handleSave = () => {
    toast.success('Settings saved successfully!')
  }

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
        {/* Threshold Settings */}
        <motion.div
          whileHover={{ scale: 1.02 }}
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
                onChange={(e) => setSettings({
                  ...settings,
                  thresholds: { ...settings.thresholds, [key]: parseInt(e.target.value) }
                })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Current: {value}</span>
                <span>Max: 100</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaBell className="mr-2 text-yellow-600" /> Notification Preferences
          </h2>
          {Object.entries(settings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between mb-4">
              <span className="text-gray-700 capitalize">{key} Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </motion.div>

        {/* Camera Settings */}
        <motion.div
          whileHover={{ scale: 1.02 }}
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
                  onChange={(e) => setSettings({
                    ...settings,
                    camera: { ...settings.camera, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </motion.div>

        {/* Network Settings */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaWifi className="mr-2 text-green-600" /> Network Configuration
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WiFi SSID</label>
              <input
                type="text"
                value={settings.network.ssid}
                onChange={(e) => setSettings({
                  ...settings,
                  network: { ...settings.network, ssid: e.target.value }
                })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">MQTT Broker</label>
              <input
                type="text"
                value={settings.network.mqttBroker}
                onChange={(e) => setSettings({
                  ...settings,
                  network: { ...settings.network, mqttBroker: e.target.value }
                })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Cloud Sync</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.network.cloudSync}
                  onChange={(e) => setSettings({
                    ...settings,
                    network: { ...settings.network, cloudSync: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Settings