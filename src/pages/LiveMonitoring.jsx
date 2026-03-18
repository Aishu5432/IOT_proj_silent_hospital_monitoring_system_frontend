import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { 
  FaVideo, 
  FaMicrophone, 
  FaStop,
  FaPlay,
  FaCamera,
  FaSync,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa'
import { BsBroadcast } from 'react-icons/bs'

const LiveMonitoring = () => {
  const { sensorData } = useApp()
  const [isStreaming, setIsStreaming] = useState(false)
  const [cameraFeed, setCameraFeed] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [detectedObjects, setDetectedObjects] = useState([])

  // Simulate camera feed
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100)
        setDetectedObjects([
          { type: 'person', confidence: Math.random() * 0.3 + 0.7 },
          { type: 'bed', confidence: Math.random() * 0.2 + 0.8 },
          { type: 'monitor', confidence: Math.random() * 0.3 + 0.6 }
        ])
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isStreaming])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-gray-800">Live Monitoring</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Camera Feed */}
        <motion.div 
          className="lg:col-span-2 bg-black rounded-xl overflow-hidden shadow-2xl"
          whileHover={{ scale: 1.02 }}
        >
          <div className="relative aspect-video bg-gray-900">
            {isStreaming ? (
              <>
                <img 
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                  alt="Camera Feed"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute top-4 left-4 flex space-x-2">
                  <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm flex items-center">
                    <BsBroadcast className="mr-1 animate-pulse" /> LIVE
                  </span>
                  <span className="px-3 py-1 bg-black bg-opacity-50 text-white rounded-full text-sm">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black bg-opacity-50 backdrop-blur-sm p-3 rounded-lg">
                    <div className="flex justify-between text-white text-sm">
                      <span>Audio Level</span>
                      <span>{Math.round(audioLevel)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${audioLevel}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <FaVideo className="text-6xl mb-4" />
                <p>Camera feed is offline</p>
                <button
                  onClick={() => setIsStreaming(true)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Start Monitoring
                </button>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="bg-gray-100 p-4 flex justify-between items-center">
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsStreaming(!isStreaming)}
                className={`p-3 rounded-full transition ${
                  isStreaming 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isStreaming ? <FaStop /> : <FaPlay />}
              </button>
              <button className="p-3 bg-white rounded-full hover:bg-gray-200 transition">
                <FaCamera />
              </button>
              <button className="p-3 bg-white rounded-full hover:bg-gray-200 transition">
                <FaMicrophone />
              </button>
            </div>
            <button className="p-3 bg-white rounded-full hover:bg-gray-200 transition">
              <FaSync />
            </button>
          </div>
        </motion.div>

        {/* Object Detection Panel */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          whileHover={{ scale: 1.02 }}
        >
          <h2 className="text-xl font-semibold mb-4">Object Detection</h2>
          {isStreaming ? (
            <>
              <div className="space-y-3 mb-6">
                {detectedObjects.map((obj, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium capitalize">{obj.type}</span>
                      <span className="text-sm text-gray-600">
                        {(obj.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${obj.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Room Status */}
              <h2 className="text-xl font-semibold mb-4 mt-6">Room Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">People Detected</span>
                  <span className="text-2xl font-bold">{sensorData.crowd}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Noise Level</span>
                  <span className={`text-2xl font-bold ${
                    sensorData.noise > 50 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {sensorData.noise} dB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Motion Status</span>
                  {sensorData.crowd > 0 ? (
                    <span className="flex items-center text-yellow-600">
                      <FaExclamationTriangle className="mr-1" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center text-green-600">
                      <FaCheckCircle className="mr-1" /> Quiet
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Start monitoring to view object detection</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default LiveMonitoring