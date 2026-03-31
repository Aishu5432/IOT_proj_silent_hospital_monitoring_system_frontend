import {
  API_TIMEOUT_MS,
  DEFAULT_SENSOR_DATA,
  POLLING_INTERVAL_MS,
} from "../utils/constants";
import { mergeSensorData, toBoolean, toNumberOrNull } from "../utils/helpers";

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5000";

const getEnv = () => {
  return {
    backendBaseUrl: BACKEND_BASE_URL,
  };
};

const withTimeout = async (promise, timeoutMs, controller) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller?.abort();
      reject(new Error("Request timed out"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildBackendUrl = (path, params = {}) => {
  const { backendBaseUrl } = getEnv();
  const search = new URLSearchParams(params);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return `${backendBaseUrl}${path}${suffix}`;
};

export const normalizeBackendData = (payload) => {
  if (!payload) {
    return DEFAULT_SENSOR_DATA;
  }

  return mergeSensorData({
    temperature: toNumberOrNull(payload.temperature),
    humidity: toNumberOrNull(payload.humidity),
    distance: toNumberOrNull(payload.distance),
    soundLevel: toNumberOrNull(payload.sound_level),
    motion: toBoolean(payload.motion),
    personCount:
      toNumberOrNull(payload.current_count ?? payload.estimated_occupancy) ?? 0,
    currentCount:
      toNumberOrNull(payload.current_count ?? payload.estimated_occupancy) ?? 0,
    estimatedOccupancy: toNumberOrNull(payload.estimated_occupancy) ?? 0,
    lastEvent: payload.last_event || null,
    cameraStatus: "unknown",
    timestamp: payload.timestamp || new Date().toISOString(),
    source: payload.source || "backend",
  });
};

const requestBackend = async ({
  path,
  params = {},
  signal,
  method = "GET",
  body,
} = {}) => {
  const controller = new AbortController();
  const activeSignal = signal || controller.signal;

  const url = buildBackendUrl(path, params);
  const response = await withTimeout(
    fetch(url, {
      method,
      signal: activeSignal,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    API_TIMEOUT_MS,
    controller,
  );

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return response.json();
};

const withRetries = async (runner, { retries = 2, delayMs = 1200 } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      console.log(`[API] Attempt ${attempt + 1}/${retries + 1}`);
      return await runner();
    } catch (error) {
      lastError = error;
      console.error(`[API] Attempt ${attempt + 1} failed:`, error.message);
      if (attempt < retries) {
        const delay = delayMs * (attempt + 1);
        console.log(`[API] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  console.error("[API] All retry attempts exhausted");
  throw lastError;
};

export const fetchLatestSensorData = async ({ signal, retries = 2 } = {}) => {
  const data = await withRetries(
    () => requestBackend({ path: "/api/latest", signal }),
    { retries },
  );

  return normalizeBackendData(data?.data);
};

export const fetchHistoricalSensorData = async ({
  results = 48,
  signal,
  retries = 2,
} = {}) => {
  const data = await withRetries(
    () =>
      requestBackend({
        path: "/api/history",
        params: { limit: results },
        signal,
      }),
    { retries },
  );

  const rows = Array.isArray(data?.data) ? [...data.data].reverse() : [];
  return rows.map(normalizeBackendData).filter((item) => item.timestamp);
};

export const fetchHealthStatus = async ({ signal, retries = 1 } = {}) => {
  const data = await withRetries(
    () => requestBackend({ path: "/api/health", signal }),
    { retries },
  );

  return {
    status: data?.status || "unknown",
    timestamp: data?.timestamp || null,
  };
};

export const fetchOccupancyStatus = async ({ signal, retries = 2 } = {}) => {
  const data = await withRetries(
    () => requestBackend({ path: "/api/occupancy", signal }),
    { retries },
  );

  const payload = data?.data || {};
  return {
    currentCount: toNumberOrNull(payload.current_count) ?? 0,
    lastState:
      typeof payload.last_state === "string"
        ? payload.last_state.toLowerCase()
        : "clear",
    lastTriggerTime: payload.last_trigger_time || null,
    timestamp: payload.timestamp || null,
  };
};

export const fetchEntryLogs = async ({
  limit = 20,
  signal,
  retries = 2,
} = {}) => {
  const data = await withRetries(
    () =>
      requestBackend({ path: "/api/entry-logs", params: { limit }, signal }),
    { retries },
  );

  return Array.isArray(data?.data) ? data.data : [];
};

export const resetOccupancy = async ({ signal, retries = 1 } = {}) => {
  const data = await withRetries(
    () => requestBackend({ path: "/api/reset", signal, method: "POST" }),
    { retries },
  );

  return {
    status: data?.status || "error",
    message: data?.message || "Reset request completed.",
    data: data?.data || null,
  };
};

export const fetchBackendConfig = async ({ signal, retries = 2 } = {}) => {
  const data = await withRetries(
    () => requestBackend({ path: "/api/config", signal }),
    { retries },
  );
  return data?.data || {};
};

export const createThingSpeakPoller = ({
  intervalMs = POLLING_INTERVAL_MS,
  onLoading,
  onData,
  onError,
  retries = 2,
} = {}) => {
  let timerId = null;
  let disposed = false;
  let started = false;

  const tick = async () => {
    if (disposed) return;
    onLoading?.(true);

    try {
      const latestData = await fetchLatestSensorData({ retries });
      onData?.(latestData);
      onError?.(null);
    } catch (error) {
      onError?.(error);
    } finally {
      onLoading?.(false);
    }
  };

  const start = () => {
    if (disposed || started) return;
    started = true;
    tick();
    timerId = setInterval(tick, intervalMs);
  };

  const stop = () => {
    disposed = true;
    started = false;
    if (timerId) clearInterval(timerId);
  };

  return { start, stop };
};
