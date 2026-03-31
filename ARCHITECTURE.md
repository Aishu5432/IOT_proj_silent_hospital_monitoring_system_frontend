# Architecture Context Document

## 1) High-Level Overview
This monorepo implements a smart hospital room monitoring platform with a React frontend and a Flask backend. The backend polls ThingSpeak every 15 seconds, performs entry-based occupancy estimation from ultrasonic distance transitions, persists telemetry in SQLite, and exposes REST APIs consumed by the frontend. The architecture is a client-server model with a service-oriented frontend data layer and a modular backend runtime (config, data access, domain logic, integration service, HTTP API).

## 2) Technology Stack
### Frontend
- Framework: React 18 + Vite 4
- Routing: React Router (`BrowserRouter`, route-per-page)
- State Management:
  - Global app state via React Context (`AppContext`) for sensor stream, alerts, loading, errors
  - Local component state via hooks (`useState`, `useEffect`, `useMemo`)
- Data Access: Custom API service in `src/services/api.js` using browser `fetch` (with timeout + retry wrapper)
- UI Libraries:
  - Tailwind CSS for styling
  - Framer Motion for animations
  - Recharts/Chart.js for visualizations
  - React Icons, React Hot Toast

### Backend
- Language/Framework: Python 3 + Flask
- Database: SQLite (`data/iot.db`)
- ORM: None (raw SQL via `sqlite3`)
- Background Processing: Python thread inside Flask process (`worker_loop`)
- External Integration: ThingSpeak REST API via `requests`
- CORS: `flask-cors` enabled
- Authentication: None implemented in current version

## 3) Directory Structure
```text
.
├── Backend/
│   └── iot-backend/
│       ├── app.py                 # Flask app, routes, background worker orchestration
│       ├── config.py              # Env-driven runtime config loader
│       ├── db.py                  # SQLite schema init + CRUD helpers
│       ├── occupancy_logic.py     # Entry-based occupancy state machine/domain logic
│       ├── thingspeak_service.py  # ThingSpeak fetch + normalization + demo fallback
│       ├── requirements.txt       # Python dependencies
│       ├── .env                   # Backend runtime environment variables (local)
│       └── data/
│           └── iot.db             # SQLite database file
├── src/
│   ├── main.jsx                   # React bootstrapping
│   ├── App.jsx                    # App shell, router, layout composition
│   ├── pages/                     # Route-level UI screens
│   │   ├── Dashboard.jsx          # Main telemetry + trends + status
│   │   ├── Analytics.jsx          # Historical charting and aggregations
│   │   ├── Alerts.jsx             # Threshold alerts + entry log display
│   │   ├── Settings.jsx           # Local thresholds + backend config + reset action
│   │   ├── LiveMonitoring.jsx     # Simulated live feed UI + room status
│   │   ├── Home.jsx               # Landing page
│   │   └── Documentation.jsx      # Project documentation page
│   ├── context/
│   │   └── AppContext.jsx         # Global sensor stream + alert lifecycle state
│   ├── services/
│   │   ├── api.js                 # Backend REST client wrappers + normalization
│   │   ├── mqttService.js         # Polling stream orchestration (legacy name)
│   │   └── settingsService.js     # LocalStorage settings read/write/subscribe
│   ├── utils/
│   │   ├── constants.js           # Default data/settings + timing constants
│   │   ├── helpers.js             # Type conversion, formatting, freshness, aggregation
│   │   └── alertEngine.js         # Threshold alert generation + dedupe + TTL pruning
│   ├── components/
│   │   ├── Common/                # Loader/ErrorBoundary and shared UI pieces
│   │   ├── Dashboard/             # Dashboard cards/charts/widgets
│   │   └── Layout/                # Navbar/Sidebar/Footer
│   └── styles/
│       └── global.css             # Global styling entry
├── .env                           # Frontend env vars (Vite)
├── .env.example                   # Frontend env template
├── package.json                   # Frontend scripts/dependencies
└── README.md                      # Frontend usage documentation
```

## 4) Core Design Patterns & Conventions
### API Request Handling
- Frontend uses a centralized request utility in `src/services/api.js`:
  - `requestBackend(...)` wraps `fetch`
  - timeout via `AbortController`
  - retry policy via `withRetries(...)`
  - all endpoint wrappers return normalized, UI-friendly data
- Backend exposes REST endpoints under `/api/*` with JSON response envelopes (`status`, `data`, optional `message`).

### Business Logic Placement
- Frontend business logic:
  - `AppContext` owns stream lifecycle and cross-page sensor/alert state
  - `alertEngine` owns threshold rules, severity, deduplication, TTL behavior
  - pages focus on presentation and endpoint orchestration
- Backend business logic:
  - `occupancy_logic.py` encapsulates entry-based occupancy state transitions
  - `thingspeak_service.py` encapsulates external integration and data normalization
  - `db.py` encapsulates persistence concerns
  - `app.py` composes services and exposes HTTP routes

### Naming & Coding Conventions
- Frontend:
  - React components/pages: `PascalCase` filenames (`Dashboard.jsx`)
  - services/utils: `camelCase` filenames (`settingsService.js`)
  - variables/functions: `camelCase`
- Backend:
  - modules/functions/variables: `snake_case`
  - constants in config dataclass fields are uppercase env-key aligned
- Data shape convention:
  - Backend API outputs mostly `snake_case` keys
  - Frontend service normalizes to mixed UI model (`soundLevel`, `personCount`, etc.) for component use

## 5) Database Schema / Data Models
SQLite database (`data/iot.db`) uses three core tables:

1. `sensor_data`
- Purpose: time-series snapshots of normalized sensor values and estimated occupancy
- Columns: `id`, `temperature`, `humidity`, `distance`, `sound_level`, `motion`, `estimated_occupancy`, `entry_events`, `timestamp`

2. `occupancy_state`
- Purpose: snapshot history of occupancy state machine outputs
- Columns: `id`, `current_count`, `last_state`, `last_trigger_time`, `timestamp`

3. `entry_logs`
- Purpose: discrete occupancy events
- Columns: `id`, `event_type` (`ENTRY`, `EXIT`, `RESET`), `distance`, `timestamp`

Relationships:
- No explicit foreign keys.
- Correlation is temporal (`timestamp`) and process-driven (each poll cycle can create one `sensor_data` + one `occupancy_state`; `entry_logs` are event-driven).

## 6) Security Posture & Authentication
- Authentication/authorization: not implemented (no users, tokens, sessions, RBAC).
- API exposure: open local REST API with CORS enabled; currently suitable for local/demo environments.
- Input/data validation:
  - ThingSpeak payload conversion to safe numeric/bool forms
  - value clamping for sensor ranges in `validate_and_normalize_sensor_values(...)`
  - occupancy guardrails (cooldown, transition windows, non-negative count)
- Operational risk notes:
  - no API auth, rate limiting, CSRF, or request schema validation layer
  - should be hardened before internet exposure or production deployment

## 7) Environment Setup
### Frontend Environment Variables
- `VITE_BACKEND_BASE_URL`: Base URL for Flask backend API (for example local dev host/port).

### Backend Environment Variables
- `THINGSPEAK_CHANNEL_ID`: ThingSpeak channel identifier to poll.
- `THINGSPEAK_READ_API_KEY`: ThingSpeak read API key.
- `FETCH_INTERVAL_SECONDS`: Polling interval for ThingSpeak worker.
- `ENTRY_DISTANCE_THRESHOLD`: Distance threshold to detect occupied entry zone.
- `ENTRY_COOLDOWN_SECONDS`: Debounce/cooldown between counted crossings.
- `ENTRY_CLEAR_DISTANCE_THRESHOLD`: Distance threshold to classify entry zone as clear.
- `CROSSING_MAX_SECONDS`: Maximum crossing window for event qualification.
- `CROWD_ALERT_THRESHOLD`: Estimated occupancy threshold for crowd alert logging.
- `THINGSPEAK_TIMEOUT_SECONDS`: HTTP timeout for ThingSpeak requests.
- `DEMO_MODE_ENABLED`: Enables synthetic fallback data when ThingSpeak is unavailable.
- `DATABASE_PATH`: SQLite file path.
- `FLASK_HOST`: Flask bind host.
- `FLASK_PORT`: Flask bind port.

---
This document is intended to be provided to LLMs as context so generated code aligns with the current architecture, layering, naming, and data flow patterns.
