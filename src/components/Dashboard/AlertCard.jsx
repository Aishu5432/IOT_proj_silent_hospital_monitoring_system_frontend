import React from "react";
import { motion } from "framer-motion";
import {
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
} from "react-icons/fa";

const AlertCard = ({ alert }) => {
  const getIcon = () => {
    switch (alert.type) {
      case "critical":
        return <FaExclamationTriangle className="text-red-700" />;
      case "warning":
        return <FaExclamationTriangle className="text-yellow-500" />;
      case "error":
        return <FaExclamationTriangle className="text-red-500" />;
      case "info":
        return <FaInfoCircle className="text-blue-500" />;
      default:
        return <FaCheckCircle className="text-green-500" />;
    }
  };

  const getBgColor = () => {
    switch (alert.type) {
      case "critical":
        return "bg-red-100 border-red-300";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-green-50 border-green-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-lg border ${getBgColor()} flex items-start space-x-3`}
    >
      <div className="flex-shrink-0 mt-1">{getIcon()}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{alert.message}</p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(alert.timestamp).toLocaleString()}
        </p>
        {alert.value !== undefined && alert.value !== null && (
          <p className="text-xs mt-2">
            Value: <span className="font-bold">{alert.value}</span> (Threshold:{" "}
            {alert.threshold})
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default AlertCard;
