import mqtt from "mqtt";
import { createThingSpeakPoller } from "./api";
import { mergeSensorData } from "../utils/helpers";
import { POLLING_INTERVAL_MS } from "../utils/constants";

const parseMqttPayload = (payload) => {
  console.log('[MQTT] Parsing payload:', payload.toString());
  try {
    const parsed = JSON.parse(payload.toString());
    console.log('[MQTT] Parsed JSON:', parsed);
    const normalized = mergeSensorData({
      temperature: parsed.temperature,
      humidity: parsed.humidity,
      distance: parsed.distance,
      soundLevel: parsed.soundLevel,
      motion: Boolean(parsed.motion),
      personCount: parsed.personCount ?? 0,
      cameraStatus: parsed.cameraStatus || "online",
      timestamp: parsed.timestamp || new Date().toISOString(),
      source: "mqtt",
    });
    console.log('[MQTT] Normalized data:', normalized);
    return normalized;
  } catch (error) {
    console.error('[MQTT] Failed to parse payload:', error);
    return null;
  }
};

export const startSensorStream = ({
  onData,
  onError,
  onLoading,
  onConnectionChange,
  pollingIntervalMs = POLLING_INTERVAL_MS,
} = {}) => {
  console.log('[MQTT Service] Starting sensor stream...');
  let client = null;
  let isMqttConnected = false;
  let fallbackStarted = false;
  let fallbackTimer = null;

  const mqttUrl = import.meta.env.VITE_MQTT_BROKER_URL;
  const mqttTopic = import.meta.env.VITE_MQTT_TOPIC || "hospital/sensors";
  console.log('[MQTT Service] Config:', { mqttUrl: mqttUrl || 'not set', mqttTopic });

  const poller = createThingSpeakPoller({
    intervalMs: pollingIntervalMs,
    onData,
    onError,
    onLoading,
  });

  const startPollingFallback = () => {
    if (fallbackStarted) return;
    console.log('[MQTT Service] Starting polling fallback');
    fallbackStarted = true;
    onConnectionChange?.("polling");
    poller.start();
  };

  if (!mqttUrl) {
    console.log('[MQTT Service] No MQTT URL configured, using polling');
    startPollingFallback();
  } else {
    console.log('[MQTT Service] Attempting MQTT connection to:', mqttUrl);
    onConnectionChange?.("connecting");
    try {
      client = mqtt.connect(mqttUrl);

      client.on("connect", () => {
        console.log('[MQTT Service] Connected successfully');
        isMqttConnected = true;
        onConnectionChange?.("mqtt");
        client.subscribe(mqttTopic, (err) => {
          if (err) {
            console.error('[MQTT Service] Subscription failed:', err);
            onError?.(new Error("Failed to subscribe to MQTT topic"));
            if (!isMqttConnected) startPollingFallback();
          } else {
            console.log('[MQTT Service] Subscribed to topic:', mqttTopic);
          }
        });
      });

      client.on("message", (topic, payload) => {
        console.log('[MQTT Service] Message received on topic:', topic);
        const normalized = parseMqttPayload(payload);
        if (!normalized) {
          onError?.(new Error("Invalid MQTT payload received"));
          return;
        }
        console.log('[MQTT Service] Delivering data:', normalized);
        onData?.(normalized);
      });

      client.on("error", (error) => {
        console.error('[MQTT Service] Connection error:', error);
        onError?.(error);
        if (!isMqttConnected) startPollingFallback();
      });

      client.on("close", () => {
        console.log('[MQTT Service] Connection closed');
        if (isMqttConnected) {
          isMqttConnected = false;
          startPollingFallback();
        }
      });

      // Safety fallback: if MQTT does not connect quickly, polling keeps data flowing.
      fallbackTimer = setTimeout(() => {
        if (!isMqttConnected) {
          console.log('[MQTT Service] Connection timeout, falling back to polling');
          startPollingFallback();
        }
      }, 5000);
    } catch (error) {
      console.error('[MQTT Service] Failed to initialize:', error);
      onError?.(error);
      startPollingFallback();
    }
  }

  return () => {
    console.log('[MQTT Service] Cleaning up sensor stream');
    if (fallbackTimer) clearTimeout(fallbackTimer);
    poller.stop();
    if (client) {
      console.log('[MQTT Service] Disconnecting MQTT client');
      client.end(true);
    }
  };
};
