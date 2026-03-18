import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  FaHospital, 
  FaMicrochip, 
  FaCloudUploadAlt, 
  FaShieldAlt,
  FaChartLine,
  FaBell,
  FaTemperatureHigh,
  FaVolumeUp,
  FaUsers
} from 'react-icons/fa'
import { BsDropletHalf } from 'react-icons/bs'

const Home = () => {
  const features = [
    {
      icon: <FaVolumeUp className="text-4xl text-blue-500" />,
      title: "Noise Monitoring",
      description: "Real-time noise level detection to maintain peaceful environment"
    },
    {
      icon: <FaTemperatureHigh className="text-4xl text-orange-500" />,
      title: "Temperature Control",
      description: "Continuous temperature monitoring for patient comfort"
    },
    {
      icon: <BsDropletHalf className="text-4xl text-cyan-500" />,
      title: "Humidity Tracking",
      description: "Optimal humidity levels for faster recovery"
    },
    {
      icon: <FaUsers className="text-4xl text-green-500" />,
      title: "Crowd Detection",
      description: "Monitor and control visitor count in patient rooms"
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4"
    >
      {/* Hero Section */}
      <section className="text-center py-20">
        <motion.h1 
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent"
        >
          Silent Hospital Room
          <br />
          Monitoring System
        </motion.h1>
        <motion.p 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
        >
          IoT-based smart healthcare solution for continuous environmental monitoring, 
          ensuring patient comfort and faster recovery through real-time data analysis.
        </motion.p>
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4 }}
          className="space-x-4"
        >
          <Link to="/dashboard">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105">
              Go to Dashboard
            </button>
          </Link>
          <Link to="/documentation">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-full text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition">
              Learn More
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition text-center"
            >
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* System Requirements */}
      <section className="py-16 bg-white rounded-2xl shadow-lg my-12">
        <div className="container mx-auto px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">System Requirements</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-blue-600 flex items-center">
                <FaMicrochip className="mr-2" /> Hardware
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>Raspberry Pi (Model 3/4)</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>Sound Sensor (Microphone module)</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>DHT11 Temperature & Humidity Sensor</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>Ultrasonic Sensor (HC-SR04)</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>Raspberry Pi Camera Module</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>ESP8266 WiFi Module</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4 text-green-600 flex items-center">
                <FaCloudUploadAlt className="mr-2" /> Software
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>Raspberry Pi OS</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>Python Programming</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>React + Vite Frontend</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>MQTT Protocol</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>WebSocket for Real-time Data</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Flow */}
      <section className="py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">System Architecture</h2>
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl">
          <div className="flex flex-wrap justify-center items-center gap-4">
            {['Sensors', 'Raspberry Pi', 'WiFi', 'Cloud', 'Dashboard'].map((item, index) => (
              <React.Fragment key={item}>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="bg-white px-6 py-3 rounded-lg shadow-md font-semibold"
                >
                  {item}
                </motion.div>
                {index < 4 && (
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-2xl text-gray-400"
                  >
                    →
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  )
}

export default Home