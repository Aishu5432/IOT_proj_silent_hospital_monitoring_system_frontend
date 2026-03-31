export const DEFAULT_SENSOR_DATA = {
  temperature: null,
  humidity: null,
  distance: null,
  soundLevel: null,
  motion: false,
  personCount: 0,
  currentCount: 0,
  estimatedOccupancy: 0,
  lastEvent: null,
  cameraStatus: "unknown",
  timestamp: null,
  source: "unavailable",
};

export const DEFAULT_SETTINGS = {
  thresholds: {
    temperature: 28,
    humidity: 70,
    soundLevel: 50,
    crowd: 2,
  },
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  camera: {
    enabled: true,
    motionDetection: true,
    recording: false,
  },
  network: {
    ssid: "Hospital_WiFi",
    mqttBroker: "",
    cloudSync: true,
  },
};

export const STORAGE_KEYS = {
  SETTINGS: "silentcare.settings.v1",
  THEME: "silentcare.theme.v1",
};

export const POLLING_INTERVAL_MS = 15_000;
export const API_TIMEOUT_MS = 10_000;
export const ALERT_TTL_MS = 10 * 60 * 1000;

export const FRESHNESS_WINDOWS_MS = {
  fresh: 30_000,
  warning: 120_000,
};

export const THINGSPEAK_FIELDS = {
  temperature: "field1",
  humidity: "field2",
  distance: "field3",
  soundLevel: "field4",
  motion: "field5",
  personCount: "field6",
};
