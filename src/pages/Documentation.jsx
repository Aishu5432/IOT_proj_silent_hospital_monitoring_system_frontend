import React from 'react'
import { motion } from 'framer-motion'
import { 
  FaMicrochip, 
  FaCode, 
  FaShieldAlt, 
  FaCloud,
  FaWifi,
  FaDatabase,
  FaLock,
  FaGithub
} from 'react-icons/fa'

const Documentation = () => {
  const sections = [
    {
      title: 'System Architecture',
      icon: <FaMicrochip className="text-4xl text-blue-600" />,
      content: [
        'Raspberry Pi (Model 3/4) as central processing unit',
        'Multiple sensors: Sound Sensor, DHT11, Ultrasonic HC-SR04',
        'ESP8266 for WiFi communication',
        'Camera module for visual monitoring',
        'Real-time data processing and alert generation'
      ]
    },
    {
      title: 'Protocols Supported',
      icon: <FaWifi className="text-4xl text-green-600" />,
      content: [
        'WiFi (IEEE 802.11) for wireless communication',
        'HTTP/HTTPS for web server integration',
        'MQTT for lightweight IoT messaging',
        'I2C/GPIO for sensor interfacing',
        'CSI interface for camera data transmission'
      ]
    },
    {
      title: 'Security Features',
      icon: <FaLock className="text-4xl text-red-600" />,
      content: [
        'End-to-end encryption for data transmission',
        'Role-based access control',
        'Secure WiFi communication (WPA2)',
        'HTTPS/MQTT TLS encryption',
        'Patient privacy protection mechanisms'
      ]
    },
    {
      title: 'Cloud Integration',
      icon: <FaCloud className="text-4xl text-purple-600" />,
      content: [
        'ThingSpeak for IoT analytics',
        'Firebase real-time database',
        'AWS IoT Core integration',
        'Blynk for mobile dashboard',
        'Data visualization and alerts'
      ]
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
        System Documentation
      </h1>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        {['Hardware Setup', 'Software Installation', 'API Reference', 'Troubleshooting'].map((item, index) => (
          <motion.a
            key={item}
            href={`#${item.toLowerCase().replace(' ', '-')}`}
            whileHover={{ scale: 1.05 }}
            className="bg-white p-4 rounded-lg shadow-md text-center hover:shadow-lg transition"
          >
            <span className="text-blue-600 font-medium">{item}</span>
          </motion.a>
        ))}
      </div>

      {/* Main Documentation Sections */}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <motion.section
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            <div className="flex items-center space-x-4 mb-6">
              {section.icon}
              <h2 className="text-2xl font-bold text-gray-800">{section.title}</h2>
            </div>
            <ul className="space-y-3">
              {section.content.map((item, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        ))}
      </div>

      {/* Setup Guide */}
      <section className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-6">Quick Setup Guide</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg">
            <div className="text-3xl mb-4">1️⃣</div>
            <h3 className="font-semibold mb-2">Hardware Setup</h3>
            <p className="text-gray-600 text-sm">
              Connect all sensors to Raspberry Pi GPIO pins. Ensure proper power supply and connections.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg">
            <div className="text-3xl mb-4">2️⃣</div>
            <h3 className="font-semibold mb-2">Software Installation</h3>
            <p className="text-gray-600 text-sm">
              Install required libraries and dependencies. Configure MQTT broker and cloud services.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg">
            <div className="text-3xl mb-4">3️⃣</div>
            <h3 className="font-semibold mb-2">Dashboard Access</h3>
            <p className="text-gray-600 text-sm">
              Access the web dashboard through local network or configure remote access.
            </p>
          </div>
        </div>
      </section>

      {/* GitHub Link */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="mt-8 text-center"
      >
        <a 
          href="#" 
          className="inline-flex items-center space-x-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
        >
          <FaGithub className="text-2xl" />
          <span>View on GitHub</span>
        </a>
      </motion.div>
    </motion.div>
  )
}

export default Documentation