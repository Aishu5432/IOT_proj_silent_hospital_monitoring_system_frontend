import { DEFAULT_SENSOR_DATA, FRESHNESS_WINDOWS_MS } from "./constants";

export const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true" || value === "on")
    return true;
  return false;
};

export const formatDateTime = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

export const formatTime = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleTimeString();
};

export const mergeSensorData = (partialData = {}) => ({
  ...DEFAULT_SENSOR_DATA,
  ...partialData,
});

export const isSensorDataValid = (data) => {
  if (!data || !data.timestamp) return false;
  const ts = new Date(data.timestamp).getTime();
  return Number.isFinite(ts);
};

export const getDataFreshness = (timestamp) => {
  if (!timestamp) {
    return {
      level: "stale",
      label: "No data",
      ageMs: Number.POSITIVE_INFINITY,
      colorClass: "text-red-600",
      dotClass: "bg-red-500",
    };
  }

  const ageMs = Date.now() - new Date(timestamp).getTime();
  if (ageMs <= FRESHNESS_WINDOWS_MS.fresh) {
    return {
      level: "fresh",
      label: "Live",
      ageMs,
      colorClass: "text-green-600",
      dotClass: "bg-green-500",
    };
  }

  if (ageMs <= FRESHNESS_WINDOWS_MS.warning) {
    return {
      level: "aging",
      label: "Delayed",
      ageMs,
      colorClass: "text-yellow-600",
      dotClass: "bg-yellow-500",
    };
  }

  return {
    level: "stale",
    label: "Stale",
    ageMs,
    colorClass: "text-red-600",
    dotClass: "bg-red-500",
  };
};

export const groupByHour = (rows = []) => {
  const hours = new Array(24).fill(null).map((_, hour) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    soundLevel: 0,
    personCount: 0,
    samples: 0,
  }));

  rows.forEach((row) => {
    if (!row.timestamp) return;
    const date = new Date(row.timestamp);
    const hour = date.getHours();
    const bucket = hours[hour];
    if (typeof row.soundLevel === "number") bucket.soundLevel += row.soundLevel;
    if (typeof row.personCount === "number")
      bucket.personCount += row.personCount;
    bucket.samples += 1;
  });

  return hours.map((bucket) => ({
    hour: bucket.hour,
    soundLevel: bucket.samples
      ? Number((bucket.soundLevel / bucket.samples).toFixed(2))
      : 0,
    personCount: bucket.samples
      ? Number((bucket.personCount / bucket.samples).toFixed(2))
      : 0,
  }));
};

export const movingAverage = (rows = [], key, windowSize = 3) => {
  return rows.map((row, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const slice = rows.slice(start, index + 1);
    const values = slice
      .map((item) => item[key])
      .filter((value) => typeof value === "number");
    const avg = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;
    return {
      ...row,
      [`${key}Avg`]: Number(avg.toFixed(2)),
    };
  });
};
