import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSensorData } from "../context/AppContext";
import {
  FaVideo,
  FaStop,
  FaPlay,
  FaCamera,
  FaSync,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUserFriends,
} from "react-icons/fa";
import { BsBroadcast } from "react-icons/bs";
import { analyzeCameraFrame } from "../services/api";

const LiveMonitoring = () => {
  const { sensorData, loading } = useSensorData();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [livePersonCount, setLivePersonCount] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [detections, setDetections] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const pollTimerRef = useRef(null);
  const busyRef = useRef(false);

  const loadCameraDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput",
      );
      setAvailableCameras(videoDevices);

      if (!selectedCameraId && videoDevices.length > 0) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch {
      setAvailableCameras([]);
    }
  }, [selectedCameraId]);

  const stopCamera = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
    setIsStreaming(false);
    setIsAnalyzing(false);
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || busyRef.current) {
      return;
    }

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      return;
    }

    busyRef.current = true;
    setIsAnalyzing(true);

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frameBlob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.75);
      });

      if (!frameBlob) {
        throw new Error("Unable to capture camera frame.");
      }

      const result = await analyzeCameraFrame({ frame: frameBlob });
      setLivePersonCount(result.personCount);
      setDetections(result.detections);
      setLastAnalysis(result.timestamp);
      setCameraError(null);
    } catch (error) {
      setCameraError(error.message || "Camera analysis failed");
    } finally {
      busyRef.current = false;
      setIsAnalyzing(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const videoConstraints = selectedCameraId
        ? { deviceId: { exact: selectedCameraId } }
        : true;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      streamRef.current = stream;
      setIsStreaming(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve, reject) => {
          const video = videoRef.current;
          const timeoutId = setTimeout(() => {
            reject(new Error("Camera preview did not start in time."));
          }, 4000);

          const onReady = () => {
            clearTimeout(timeoutId);
            resolve();
          };

          video.addEventListener("loadedmetadata", onReady, { once: true });
          video.addEventListener("playing", onReady, { once: true });

          video.play().catch((playError) => {
            clearTimeout(timeoutId);
            reject(playError);
          });
        });
      }

      setCameraReady(true);
      await loadCameraDevices();

      await captureAndAnalyze();
      pollTimerRef.current = setInterval(captureAndAnalyze, 3000);
    } catch (error) {
      setCameraError(
        error?.message ||
          "Unable to access a camera. Check permissions, browser support, and HTTPS/local network access.",
      );
      stopCamera();
    }
  }, [captureAndAnalyze, loadCameraDevices, selectedCameraId, stopCamera]);

  const handleToggleStreaming = useCallback(() => {
    if (isStreaming) {
      stopCamera();
      return;
    }

    startCamera();
  }, [isStreaming, startCamera, stopCamera]);

  useEffect(() => {
    loadCameraDevices();

    return () => {
      stopCamera();
    };
  }, [loadCameraDevices, stopCamera]);

  const displayedCount =
    livePersonCount ??
    sensorData.cameraPersonCount ??
    sensorData.personCount ??
    0;

  const objectSummary =
    detections.length > 0
      ? detections.map((detection, index) => ({
          id: `${detection.x}-${detection.y}-${index}`,
          label: `Person ${index + 1}`,
          confidence:
            typeof detection.confidence === "number"
              ? `${detection.confidence.toFixed(2)}`
              : "n/a",
        }))
      : [];

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
            <div className={`w-full h-full relative ${!isStreaming ? "hidden" : "block"}`}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={() => setCameraReady(true)}
              />
              <div className="absolute top-4 left-4 flex space-x-2">
                <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm flex items-center">
                  <BsBroadcast className="mr-1 animate-pulse" /> LIVE
                </span>
                <span className="px-3 py-1 bg-black bg-opacity-50 text-white rounded-full text-sm flex items-center gap-1">
                  <FaUserFriends /> {displayedCount} detected
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black bg-opacity-50 backdrop-blur-sm p-3 rounded-lg">

                    <div className="flex justify-between text-white text-sm">
                      <span>Frame analysis</span>
                      <span>
                        {isAnalyzing
                          ? "Scanning..."
                          : cameraReady
                            ? "Active"
                            : "Starting"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-1 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 via-blue-500 to-green-500 h-2 rounded-full transition-all animate-pulse"
                        style={{
                          width: `${Math.min(displayedCount * 20, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

            {!isStreaming && (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <FaVideo className="text-6xl mb-4" />
                <p>Camera feed is offline</p>
                <p className="mt-2 text-sm text-gray-500 text-center max-w-xs">
                  Open this page on your phone or Windows PC, allow camera
                  access, and the page will send snapshots to the backend for
                  counting.
                </p>
                {availableCameras.length > 1 ? (
                  <select
                    value={selectedCameraId}
                    onChange={(event) =>
                      setSelectedCameraId(event.target.value)
                    }
                    className="mt-4 w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    {availableCameras.map((device, index) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                ) : null}
                <button
                  onClick={handleToggleStreaming}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Start Monitoring
                </button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Controls */}
          <div className="bg-gray-100 p-4 flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={handleToggleStreaming}
                className={`p-3 rounded-full transition ${
                  isStreaming
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isStreaming ? <FaStop /> : <FaPlay />}
              </button>
              <button
                onClick={captureAndAnalyze}
                disabled={!isStreaming || isAnalyzing}
                className="p-3 bg-white rounded-full hover:bg-gray-200 transition disabled:opacity-50"
                title="Capture a single frame"
              >
                <FaCamera />
              </button>
            </div>
            <div className="flex items-center gap-3">
              {availableCameras.length > 1 ? (
                <select
                  value={selectedCameraId}
                  onChange={(event) => setSelectedCameraId(event.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  {availableCameras.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
              ) : null}
              <button
                onClick={captureAndAnalyze}
                className="p-3 bg-white rounded-full hover:bg-gray-200 transition"
                title="Refresh analysis"
              >
                <FaSync />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Object Detection Panel */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6"
          whileHover={{ scale: 1.02 }}
        >
          <h2 className="text-xl font-semibold mb-4">Person Detection</h2>
          {cameraError ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {cameraError}
            </div>
          ) : null}
          {isStreaming ? (
            <>
              <div className="space-y-3 mb-6">
                {objectSummary.length > 0 ? (
                  objectSummary.map((obj) => (
                    <div key={obj.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium capitalize">
                          {obj.label}
                        </span>
                        <span className="text-sm text-gray-600">
                          Confidence {obj.confidence}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                    No people detected in the latest frame.
                  </div>
                )}
              </div>

              {/* Room Status */}
              <h2 className="text-xl font-semibold mb-4 mt-6">Room Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">People Detected</span>
                  <span className="text-2xl font-bold">{displayedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Backend Sync</span>
                  <span
                    className={`text-sm font-medium ${loading ? "text-yellow-600" : "text-green-600"}`}
                  >
                    {loading ? "Syncing" : "Live"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Motion Status</span>
                  {sensorData.motion ? (
                    <span className="flex items-center text-yellow-600">
                      <FaExclamationTriangle className="mr-1" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center text-green-600">
                      <FaCheckCircle className="mr-1" /> Quiet
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Camera Status</span>
                  <span className="text-sm capitalize text-gray-700">
                    {cameraReady ? "Connected" : "Offline"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Analysis</span>
                  <span className="text-sm text-gray-700 text-right max-w-[55%] truncate">
                    {lastAnalysis || "Not analyzed yet"}
                  </span>
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
  );
};

export default LiveMonitoring;
