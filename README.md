# SilentCare IoT Smart Hospital Monitoring Dashboard

Production-ready React + Vite frontend for a Smart Hospital room monitoring system.

## Features

- Backend API integration with normalized sensor model
- Polling stream service for stable local and Raspberry Pi setups
- Phone camera snapshot analysis for live person counting
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
  "timestamp": "2026-03-30T12:00:00.000Z",
  "source": "backend"
}
```

## Environment Variables

Create a local `.env` file (or copy from `.env.example`) and set values:

```bash
VITE_BACKEND_BASE_URL=http://localhost:5000
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

- `src/services/api.js`: backend API client, normalization, retries, polling
- `src/services/mqttService.js`: polling stream orchestration via backend API
- `src/pages/LiveMonitoring.jsx`: browser camera capture and backend person-count analysis
- `src/services/settingsService.js`: settings persistence and subscriptions
- `src/context/AppContext.jsx`: global sensor/alert/loading/error state and hooks
- `src/utils/alertEngine.js`: threshold alert logic, dedupe, expiration
- `src/utils/helpers.js`: formatting, freshness, grouping helpers
- `src/components/Dashboard/ChartComponent.jsx`: reusable chart rendering

## Future Integration Notes

- Raspberry Pi services can push to ThingSpeak and backend remains frontend source
- Camera health endpoint can update `cameraStatus`
