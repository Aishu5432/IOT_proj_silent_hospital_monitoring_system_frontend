import React, { createContext, useState, useContext, useEffect } from 'react'
import { mockSensorData } from '../services/mockData'
import toast from 'react-hot-toast'

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState(mockSensorData)
  const [alerts, setAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [theme, setTheme] = useState('light')
  const [notifications, setNotifications] = useState([])

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = {
        ...sensorData,
        noise: Math.floor(Math.random() * 30) + 30,
        temperature: Math.floor(Math.random() * 5) + 22,
        humidity: Math.floor(Math.random() * 20) + 40,
        crowd: Math.floor(Math.random() * 3),
        timestamp: new Date().toISOString()
      }
      setSensorData(newData)
      
      // Check thresholds and create alerts
      checkThresholds(newData)
    }, 5000)

    return () => clearInterval(interval)
  }, [sensorData])

  const checkThresholds = (data) => {
    const newAlerts = []
    
    if (data.noise > 50) {
      newAlerts.push({
        id: Date.now(),
        type: 'warning',
        message: 'High noise level detected!',
        value: data.noise,
        threshold: 50,
        timestamp: new Date().toISOString()
      })
      toast.error('High noise level detected!')
    }
    
    if (data.temperature > 28) {
      newAlerts.push({
        id: Date.now() + 1,
        type: 'warning',
        message: 'Temperature exceeds safe limit!',
        value: data.temperature,
        threshold: 28,
        timestamp: new Date().toISOString()
      })
      toast.error('Temperature exceeds safe limit!')
    }
    
    if (data.crowd > 2) {
      newAlerts.push({
        id: Date.now() + 2,
        type: 'info',
        message: 'Multiple people detected in room',
        value: data.crowd,
        threshold: 2,
        timestamp: new Date().toISOString()
      })
      toast('Multiple people detected', { icon: '👥' })
    }
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50))
    }
  }

  const value = {
    sensorData,
    alerts,
    isLoading,
    theme,
    notifications,
    setTheme,
    clearAlerts: () => setAlerts([])
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}