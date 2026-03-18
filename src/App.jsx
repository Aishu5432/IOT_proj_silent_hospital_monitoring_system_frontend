import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'

// Layout Components
import Navbar from './components/Layout/Navbar'
import Sidebar from './components/Layout/Sidebar'
import Footer from './components/Layout/Footer'

// Pages - ALL on ONE LINE each
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import LiveMonitoring from './pages/LiveMonitoring'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Alerts from './pages/Alerts'
import Documentation from './pages/Documentation'

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          <Navbar />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/live-monitoring" element={<LiveMonitoring />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/documentation" element={<Documentation />} />
              </Routes>
            </main>
          </div>
          <Footer />
        </div>
      </Router>
    </AppProvider>
  )
}

export default App