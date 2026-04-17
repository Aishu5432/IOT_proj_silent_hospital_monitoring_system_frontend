# IoT Backend - Smart Hospital Room Monitoring

A Flask + SQLite backend for entry-based occupancy estimation using ThingSpeak sensor feeds.

## Project Structure

- app.py
- config.py
- db.py
- thingspeak_service.py
- occupancy_logic.py
- requirements.txt
- README.md
- data/iot.db

## Features

- Polls ThingSpeak every 15 seconds (configurable)
- Parses and validates latest sensor entry safely
- Stores sensor and occupancy history in SQLite
- Entry-based occupancy estimation from ultrasonic distance transitions
- Debounce/cooldown logic to reduce double counting
- Occupancy never drops below zero
- REST APIs for React and future Unity/Oculus clients
- CORS enabled
- Demo mode fallback when ThingSpeak is unavailable
- Crowd alert logging when estimated occupancy exceeds threshold
- Phone camera snapshot analysis endpoint for person counting

## ThingSpeak Field Mapping

- field1 -> temperature
- field2 -> humidity
- field3 -> distance (ultrasonic)
- field4 -> sound_level
- field5 -> motion

## Local Development Setup

1. Open terminal in Backend/iot-backend
2. Create virtual environment:

Windows (PowerShell):
python -m venv .venv
.venv\Scripts\Activate.ps1

Linux/macOS:
python3 -m venv .venv
source .venv/bin/activate

3. Install dependencies:
pip install -r requirements.txt

4. Create environment variables (optional via .env tooling, or set directly):

THINGSPEAK_CHANNEL_ID=your_channel_id
THINGSPEAK_READ_API_KEY=your_read_api_key
FETCH_INTERVAL_SECONDS=15
ENTRY_DISTANCE_THRESHOLD=50.0
ENTRY_COOLDOWN_SECONDS=3
DATABASE_PATH=data/iot.db
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
DEMO_MODE_ENABLED=true

5. Run backend:
python app.py

Backend will be available at:
http://localhost:5000

## Raspberry Pi 3 Setup

1. Install Python 3 and pip:
sudo apt update
sudo apt install -y python3 python3-venv python3-pip

2. Copy Backend/iot-backend folder to Pi
3. Create and activate virtual environment
4. Install dependencies:
pip install -r requirements.txt

5. Export environment variables:
export THINGSPEAK_CHANNEL_ID=your_channel_id
export THINGSPEAK_READ_API_KEY=your_read_api_key
export FLASK_HOST=0.0.0.0
export FLASK_PORT=5000

6. Run:
python3 app.py

## API Endpoints

- GET /api/health
- GET /api/latest
- GET /api/history?limit=50
- GET /api/occupancy
- GET /api/entry-logs?limit=20
- POST /api/camera/analyze
- POST /api/reset
- GET /api/config

All responses are JSON.

## Endpoint Testing Examples

Health:
curl http://localhost:5000/api/health

Latest:
curl http://localhost:5000/api/latest

History:
curl "http://localhost:5000/api/history?limit=20"

Occupancy:
curl http://localhost:5000/api/occupancy

Entry logs:
curl "http://localhost:5000/api/entry-logs?limit=20"

Reset:
curl -X POST http://localhost:5000/api/reset

Config:
curl http://localhost:5000/api/config

## React Integration

Set frontend environment variable to point to backend:

VITE_BACKEND_BASE_URL=http://localhost:5000

Then use backend endpoints from frontend services instead of direct ThingSpeak access.

## Important Notes

- This project uses entry-based occupancy estimation and estimated people count, not perfect person counting.
- No camera dependency in this version.
- No OpenCV dependency in this version.
- No MQTT dependency in this version.
- ThingSpeak remains the sensor source.
- The phone-camera path uses backend snapshot analysis and can be used alongside ThingSpeak polling.
