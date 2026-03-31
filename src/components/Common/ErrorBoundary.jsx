import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected application error",
    };
  }

  componentDidCatch(error, errorInfo) {
    // Keep this log for production diagnostics and future external logging hooks.
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-red-50 to-orange-50">
          <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">{this.state.message}</p>
            <button
              onClick={this.handleReload}
              className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
