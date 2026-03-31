import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEFAULT_SENSOR_DATA } from "../utils/constants";
import { startSensorStream } from "../services/mqttService";
import {
  generateThresholdAlerts,
  pruneExpiredAlerts,
} from "../utils/alertEngine";
import {
  getThresholdSettings,
  subscribeSettings,
} from "../services/settingsService";

const AppContext = createContext();

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};

export const AppProvider = ({ children }) => {
  console.log('[AppContext] Initializing AppProvider');
  const [sensorData, setSensorData] = useState(DEFAULT_SENSOR_DATA);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const thresholdsRef = useRef(getThresholdSettings());
  console.log('[AppContext] Initial thresholds:', thresholdsRef.current);

  useEffect(() => {
    console.log('[AppContext] Setting up sensor stream and settings subscription');
    const unsubscribeSettings = subscribeSettings((nextSettings) => {
      console.log('[AppContext] Settings updated:', nextSettings);
      thresholdsRef.current = nextSettings.thresholds;
    });

    const stopSensorStream = startSensorStream({
      onLoading: (isLoading) => {
        console.log('[AppContext] Loading state:', isLoading);
        setLoading(isLoading);
      },
      onData: (nextData) => {
        console.log('[AppContext] Sensor data received:', nextData);
        setSensorData(nextData);
        setError(null);
        setAlerts((existingAlerts) => {
          const newAlerts = generateThresholdAlerts({
            sensorData: nextData,
            thresholds: thresholdsRef.current,
            existingAlerts,
          });
          console.log('[AppContext] Alerts updated, count:', newAlerts.length);
          return newAlerts;
        });
      },
      onError: (nextError) => {
        if (nextError) {
          console.error('[AppContext] Stream error:', nextError);
          setError(nextError.message || "Data stream failed");
        }
      },
    });

    const cleanupInterval = setInterval(() => {
      console.log('[AppContext] Running alert cleanup');
      setAlerts((existingAlerts) => pruneExpiredAlerts(existingAlerts));
    }, 60_000);

    return () => {
      console.log('[AppContext] Cleaning up AppProvider');
      clearInterval(cleanupInterval);
      unsubscribeSettings();
      stopSensorStream();
    };
  }, []);

  const value = useMemo(
    () => {
      console.log('[AppContext] Context value updated');
      return {
        sensorData,
        alerts,
        loading,
        error,
        clearAlerts: () => {
          console.log('[AppContext] Clearing all alerts');
          setAlerts([]);
        },
        markAlertRead: (id) => {
          console.log('[AppContext] Marking alert as read:', id);
          setAlerts((existingAlerts) =>
            existingAlerts.map((alert) =>
              alert.id === id ? { ...alert, read: true } : alert,
            ),
          );
        },
      };
    },
    [sensorData, alerts, loading, error],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useSensorData = () => {
  const { sensorData, loading, error } = useAppContext();
  return { sensorData, loading, error };
};

export const useAlerts = () => {
  const { alerts, clearAlerts, markAlertRead } = useAppContext();
  return { alerts, clearAlerts, markAlertRead };
};

export const useApp = useAppContext;
