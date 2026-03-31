# SilentCare IoT Smart Hospital Monitoring Dashboard

Production-ready React + Vite frontend for a Smart Hospital room monitoring system.

## Features

- ThingSpeak API integration with normalized sensor model
- MQTT-ready stream service with automatic polling fallback
- Global sensor and alert state via AppContext hooks
- Smart alert engine with severity, deduplication, and expiration
- Functional settings with localStorage persistence
- Reusable chart component (line, bar, area)
- Dashboard freshness indicators and stale data fallback UI
- Error boundary and consistent loader states

## Sensor Data Model

All streams are normalized to the following structure:

```json
{
  "temperature": 24.1,
  "humidity": 57,
  "distance": 142,
  "soundLevel": 46,
  "motion": false,
  "personCount": 1,
  "cameraStatus": "unknown",
  "timestamp": "2026-03-30T12:00:00.000Z"
}
```

## Environment Variables

Create a local `.env` file (or copy from `.env.example`) and set values:

```bash
VITE_THINGSPEAK_CHANNEL_ID=
VITE_THINGSPEAK_READ_KEY=
VITE_MQTT_BROKER_URL=
VITE_MQTT_TOPIC=hospital/sensors
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Architecture

- `src/services/api.js`: ThingSpeak API, normalization, retries, polling
- `src/services/mqttService.js`: MQTT stream + polling fallback orchestration
- `src/services/settingsService.js`: settings persistence and subscriptions
- `src/context/AppContext.jsx`: global sensor/alert/loading/error state and hooks
- `src/utils/alertEngine.js`: threshold alert logic, dedupe, expiration
- `src/utils/helpers.js`: formatting, freshness, grouping helpers
- `src/components/Dashboard/ChartComponent.jsx`: reusable chart rendering

## Future Integration Notes

- Raspberry Pi OpenCV person detection can feed `personCount`
- Camera health endpoint can update `cameraStatus`
- MQTT broker can become the primary stream with zero page-level changes
