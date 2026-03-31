import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../utils/constants";

const listeners = new Set();

const parseSettings = (rawValue) => {
  try {
    const parsed = JSON.parse(rawValue);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      thresholds: {
        ...DEFAULT_SETTINGS.thresholds,
        ...(parsed?.thresholds || {}),
      },
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(parsed?.notifications || {}),
      },
      camera: {
        ...DEFAULT_SETTINGS.camera,
        ...(parsed?.camera || {}),
      },
      network: {
        ...DEFAULT_SETTINGS.network,
        ...(parsed?.network || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const getSettings = () => {
  console.log('[Settings] Getting settings from localStorage');
  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!raw) {
    console.log('[Settings] No saved settings, using defaults');
    return DEFAULT_SETTINGS;
  }
  const settings = parseSettings(raw);
  console.log('[Settings] Loaded settings:', settings);
  return settings;
};

export const saveSettings = (settings) => {
  console.log('[Settings] Saving settings:', settings);
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  console.log('[Settings] Notifying', listeners.size, 'listeners');
  listeners.forEach((listener) => listener(settings));
  return settings;
};

export const updateSettings = (patch) => {
  console.log('[Settings] Updating settings with patch:', patch);
  const current = getSettings();
  const next = {
    ...current,
    ...patch,
    thresholds: {
      ...current.thresholds,
      ...(patch?.thresholds || {}),
    },
    notifications: {
      ...current.notifications,
      ...(patch?.notifications || {}),
    },
    camera: {
      ...current.camera,
      ...(patch?.camera || {}),
    },
    network: {
      ...current.network,
      ...(patch?.network || {}),
    },
  };

  console.log('[Settings] New settings:', next);
  return saveSettings(next);
};

export const subscribeSettings = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getThresholdSettings = () => getSettings().thresholds;
