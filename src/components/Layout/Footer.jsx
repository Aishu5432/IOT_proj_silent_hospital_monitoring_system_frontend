import React from 'react'

const Footer = () => {
  return (
    <footer className="bg-white shadow-inner mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <p>© 2024 Silent Hospital Room Monitoring System. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-blue-600 transition">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer