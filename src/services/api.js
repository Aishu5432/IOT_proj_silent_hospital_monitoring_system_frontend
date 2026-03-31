import {
  API_TIMEOUT_MS,
  DEFAULT_SENSOR_DATA,
  POLLING_INTERVAL_MS,
  THINGSPEAK_FIELDS,
} from "../utils/constants";
import { mergeSensorData, toBoolean, toNumberOrNull } from "../utils/helpers";

const THINGSPEAK_BASE_URL = "https://api.thingspeak.com/channels";

const getEnv = () => {
  const config = {
    channelId: import.meta.env.VITE_THINGSPEAK_CHANNEL_ID,
    readKey: import.meta.env.VITE_THINGSPEAK_READ_KEY,
  };
  console.log('[API] Environment config:', { channelId: config.channelId, readKey: config.readKey ? '***' : 'missing' });
  return config;
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

const buildThingSpeakUrl = ({ results = 1 } = {}) => {
  const { channelId, readKey } = getEnv();
  if (!channelId || !readKey) {
    console.error('[API] Missing ThingSpeak credentials');
    throw new Error("ThingSpeak environment variables are missing");
  }

  const search = new URLSearchParams({
    api_key: readKey,
    results: String(results),
  });

  const url = `${THINGSPEAK_BASE_URL}/${channelId}/feeds.json?${search.toString()}`;
  console.log('[API] Built ThingSpeak URL:', url.replace(readKey, '***'));
  return url;
};

export const normalizeThingSpeakFeed = (feed) => {
  console.log('[API] Normalizing feed:', feed);
  if (!feed) {
    console.warn('[API] No feed data to normalize');
    return DEFAULT_SENSOR_DATA;
  }

  const normalized = mergeSensorData({
    temperature: toNumberOrNull(feed[THINGSPEAK_FIELDS.temperature]),
    humidity: toNumberOrNull(feed[THINGSPEAK_FIELDS.humidity]),
    distance: toNumberOrNull(feed[THINGSPEAK_FIELDS.distance]),
    soundLevel: toNumberOrNull(feed[THINGSPEAK_FIELDS.soundLevel]),
    motion: toBoolean(feed[THINGSPEAK_FIELDS.motion]),
    personCount: toNumberOrNull(feed[THINGSPEAK_FIELDS.personCount]) ?? 0,
    cameraStatus: "unknown",
    timestamp: feed.created_at || new Date().toISOString(),
    source: "thingspeak",
  });
  console.log('[API] Normalized data:', normalized);
  return normalized;
};

const requestThingSpeak = async ({ results = 1, signal } = {}) => {
  console.log('[API] Requesting ThingSpeak data, results:', results);
  const controller = new AbortController();
  const activeSignal = signal || controller.signal;

  const url = buildThingSpeakUrl({ results });
  const response = await withTimeout(
    fetch(url, { signal: activeSignal }),
    API_TIMEOUT_MS,
    controller,
  );

  console.log('[API] Response status:', response.status, response.statusText);
  if (!response.ok) {
    console.error('[API] Request failed:', response.status, response.statusText);
    throw new Error(`ThingSpeak request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('[API] Response data:', data);
  return data;
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
  console.error('[API] All retry attempts exhausted');
  throw lastError;
};

export const fetchLatestSensorData = async ({ signal, retries = 2 } = {}) => {
  console.log('[API] Fetching latest sensor data...');
  const data = await withRetries(
    () => requestThingSpeak({ results: 1, signal }),
    { retries },
  );

  const latestFeed = data?.feeds?.[data.feeds.length - 1];
  console.log('[API] Latest feed:', latestFeed);
  const normalized = normalizeThingSpeakFeed(latestFeed);
  console.log('[API] Fetch complete, returning:', normalized);
  return normalized;
};

export const fetchHistoricalSensorData = async ({
  results = 48,
  signal,
  retries = 2,
} = {}) => {
  console.log('[API] Fetching historical sensor data, results:', results);
  const data = await withRetries(() => requestThingSpeak({ results, signal }), {
    retries,
  });

  const feeds = Array.isArray(data?.feeds) ? data.feeds : [];
  console.log('[API] Historical feeds count:', feeds.length);
  const normalized = feeds.map(normalizeThingSpeakFeed).filter((item) => item.timestamp);
  console.log('[API] Historical data normalized, count:', normalized.length);
  return normalized;
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
    console.log('[API Poller] Tick started');
    onLoading?.(true);

    try {
      const latestData = await fetchLatestSensorData({ retries });
      console.log('[API Poller] Data received:', latestData);
      onData?.(latestData);
      onError?.(null);
    } catch (error) {
      console.error('[API Poller] Error:', error);
      onError?.(error);
    } finally {
      onLoading?.(false);
      console.log('[API Poller] Tick completed');
    }
  };

  const start = () => {
    if (disposed || started) return;
    console.log('[API Poller] Starting poller, interval:', intervalMs, 'ms');
    started = true;
    tick();
    timerId = setInterval(tick, intervalMs);
  };

  const stop = () => {
    console.log('[API Poller] Stopping poller');
    disposed = true;
    started = false;
    if (timerId) clearInterval(timerId);
  };

  return { start, stop };
};
