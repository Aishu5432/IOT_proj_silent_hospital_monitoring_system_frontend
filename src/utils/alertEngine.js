import { ALERT_TTL_MS } from "./constants";

const METRIC_DEFINITIONS = [
  { key: "temperature", label: "Temperature", unit: "°C" },
  { key: "humidity", label: "Humidity", unit: "%" },
  { key: "soundLevel", label: "Noise", unit: "dB" },
  {
    key: "personCount",
    label: "Occupancy",
    unit: "people",
    thresholdKey: "crowd",
  },
];

const getSeverity = (value, threshold) => {
  if (value == null || threshold == null) return null;
  if (value >= threshold * 1.2) return "critical";
  if (value > threshold) return "warning";
  return null;
};

const createAlertId = (metricKey, severity) => `${metricKey}:${severity}`;

export const pruneExpiredAlerts = (alerts, nowMs = Date.now()) => {
  return alerts.filter((alert) => {
    const age = nowMs - new Date(alert.timestamp).getTime();
    return age <= ALERT_TTL_MS;
  });
};

export const generateThresholdAlerts = ({
  sensorData,
  thresholds,
  existingAlerts,
}) => {
  console.log('[AlertEngine] Generating alerts for sensor data:', sensorData);
  console.log('[AlertEngine] Using thresholds:', thresholds);
  if (!sensorData || !thresholds) {
    console.log('[AlertEngine] Missing data or thresholds, returning existing alerts');
    return existingAlerts;
  }

  const nextAlerts = pruneExpiredAlerts(existingAlerts);
  const activeKeys = new Set(nextAlerts.map((alert) => alert.dedupeKey));
  console.log('[AlertEngine] Active alert keys:', Array.from(activeKeys));

  METRIC_DEFINITIONS.forEach((metric) => {
    const thresholdKey = metric.thresholdKey || metric.key;
    const thresholdValue = thresholds[thresholdKey];
    const currentValue = sensorData[metric.key];

    const severity = getSeverity(currentValue, thresholdValue);
    if (!severity) return;

    const dedupeKey = createAlertId(metric.key, severity);
    if (activeKeys.has(dedupeKey)) return;

    console.log('[AlertEngine] Creating alert:', { metric: metric.key, severity, currentValue, thresholdValue });
    nextAlerts.unshift({
      id: `${dedupeKey}:${Date.now()}`,
      dedupeKey,
      metric: metric.key,
      type: severity,
      message: `${metric.label} is above threshold`,
      value: currentValue,
      threshold: thresholdValue,
      unit: metric.unit,
      read: false,
      timestamp: sensorData.timestamp || new Date().toISOString(),
    });

    activeKeys.add(dedupeKey);
  });

  // Motion is informational: create one lightweight event when active.
  if (sensorData.motion) {
    const dedupeKey = "motion:info";
    if (!activeKeys.has(dedupeKey)) {
      console.log('[AlertEngine] Creating motion alert');
      nextAlerts.unshift({
        id: `${dedupeKey}:${Date.now()}`,
        dedupeKey,
        metric: "motion",
        type: "info",
        message: "Motion detected in monitored room",
        value: 1,
        threshold: 0,
        unit: "",
        read: false,
        timestamp: sensorData.timestamp || new Date().toISOString(),
      });
    }
  }

  console.log('[AlertEngine] Total alerts:', nextAlerts.length);
  return nextAlerts.slice(0, 200);
};
