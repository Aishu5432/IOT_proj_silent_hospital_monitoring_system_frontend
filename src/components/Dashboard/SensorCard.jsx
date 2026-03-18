import React from 'react'
import { motion } from 'framer-motion'

const SensorCard = ({ title, value, icon, color, bgColor, textColor, threshold, unit }) => {
  const isWarning = parseFloat(value) > threshold
  
  return (
    <motion.div
      whileHover={{ scale: 1.05, rotateY: 5 }}
      className={`${bgColor} p-6 rounded-xl shadow-lg overflow-hidden relative`}
    >
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${color} opacity-20 rounded-bl-full`} />
      
      <div className="relative">
        <div className={`${textColor} mb-2`}>{icon}</div>
        <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
        <div className="flex items-end space-x-1">
          <span className="text-3xl font-bold text-gray-800">{value}</span>
          <span className="text-gray-500 mb-1">{unit}</span>
        </div>
        
        {/* Status Indicator */}
        <div className="mt-3 flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isWarning ? 'bg-red-500 animate-pulse' : 'bg-green-500'
          }`} />
          <span className={`text-sm ${isWarning ? 'text-red-600' : 'text-green-600'}`}>
            {isWarning ? 'Above threshold' : 'Normal'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full bg-gradient-to-r ${color}`}
            style={{ width: `${(parseFloat(value) / threshold) * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default SensorCard