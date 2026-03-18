export const mockSensorData = {
  temperature: 23.5,
  humidity: 55,
  noise: 42,
  crowd: 1,
  timestamp: new Date().toISOString(),
  status: 'normal'
}

export const mockAlerts = [
  {
    id: 1,
    type: 'warning',
    message: 'High noise level detected (48 dB)',
    timestamp: new Date().toISOString(),
    value: 48,
    threshold: 50,
    read: false
  },
  {
    id: 2,
    type: 'info',
    message: 'Temperature slightly above optimal range',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    value: 26,
    threshold: 28,
    read: true
  }
]

export const mockHistoricalData = Array.from({ length: 168 }, (_, i) => ({
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  temperature: 22 + Math.random() * 5,
  humidity: 50 + Math.random() * 20,
  noise: 35 + Math.random() * 25,
  crowd: Math.floor(Math.random() * 4)
}))