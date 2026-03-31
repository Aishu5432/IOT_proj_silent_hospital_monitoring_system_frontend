import { createThingSpeakPoller } from "./api";
import { POLLING_INTERVAL_MS } from "../utils/constants";

export const startSensorStream = ({
  onData,
  onError,
  onLoading,
  onConnectionChange,
  pollingIntervalMs = POLLING_INTERVAL_MS,
} = {}) => {
  const poller = createThingSpeakPoller({
    intervalMs: pollingIntervalMs,
    onData,
    onError,
    onLoading,
  });

  onConnectionChange?.("backend-polling");
  poller.start();

  return () => {
    poller.stop();
  };
};
