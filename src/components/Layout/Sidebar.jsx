import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaHome, 
  FaChartLine, 
  FaVideo, 
  FaChartPie,
  FaCog,
  FaBell,
  FaBook
} from 'react-icons/fa'

const Sidebar = () => {
  const menuItems = [
    { path: '/', icon: <FaHome />, label: 'Home' },
    { path: '/dashboard', icon: <FaChartLine />, label: 'Dashboard' },
    { path: '/live-monitoring', icon: <FaVideo />, label: 'Live' },
    { path: '/analytics', icon: <FaChartPie />, label: 'Analytics' },
    { path: '/alerts', icon: <FaBell />, label: 'Alerts' },
    { path: '/documentation', icon: <FaBook />, label: 'Docs' },
    { path: '/settings', icon: <FaCog />, label: 'Settings' },
  ]

  return (
    <motion.aside 
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      className="w-20 bg-white shadow-lg min-h-screen hidden lg:block"
    >
      <nav className="py-8">
        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex flex-col items-center p-3 mx-2 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </motion.aside>
  )
}

export default Sidebar