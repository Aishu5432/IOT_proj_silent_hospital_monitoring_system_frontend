import React from "react";

const Loader = ({ label = "Loading data...", compact = false }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${compact ? "py-6" : "py-16"} text-gray-600`}
      role="status"
      aria-live="polite"
    >
      <div className="spinner" aria-hidden="true" />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
};

export default Loader;
