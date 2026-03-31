import random
import time
from dataclasses import dataclass
from typing import Tuple

import requests

# ThingSpeak Write API Key (as requested)
API_KEY = "T796U6MMHF0UA2M2"
URL = "https://api.thingspeak.com/update"


@dataclass
class SensorPayload:
    temperature: float
    humidity: float
    distance: float
    sound: int
    ir: int


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(value, high))


def generate_data(mode: int, cycle: int) -> SensorPayload:
    """Generate virtual sensor data based on selected scenario mode."""
    if mode == 1:
        # High voice + high temperature
        temperature = round(random.uniform(30.0, 34.0), 2)
        humidity = round(random.uniform(45.0, 65.0), 2)
        distance = round(random.uniform(80.0, 180.0), 2)
        sound = random.randint(95, 120)
        ir = 1
    elif mode == 2:
        # Low voice + normal temperature
        temperature = round(random.uniform(23.0, 27.5), 2)
        humidity = round(random.uniform(45.0, 60.0), 2)
        distance = round(random.uniform(80.0, 180.0), 2)
        sound = random.randint(20, 45)
        ir = 0
    elif mode == 3:
        # Entry simulation pattern (distance near -> clear, motion ON)
        if cycle % 2 == 0:
            distance = round(random.uniform(20.0, 40.0), 2)
            ir = 1
        else:
            distance = round(random.uniform(80.0, 150.0), 2)
            ir = 1
        temperature = round(random.uniform(24.0, 28.0), 2)
        humidity = round(random.uniform(45.0, 60.0), 2)
        sound = random.randint(40, 70)
    elif mode == 4:
        # Exit simulation pattern (distance near -> clear, motion OFF)
        if cycle % 2 == 0:
            distance = round(random.uniform(20.0, 40.0), 2)
            ir = 0
        else:
            distance = round(random.uniform(80.0, 150.0), 2)
            ir = 0
        temperature = round(random.uniform(24.0, 28.0), 2)
        humidity = round(random.uniform(45.0, 60.0), 2)
        sound = random.randint(30, 60)
    elif mode == 5:
        # High humidity stress case
        temperature = round(random.uniform(24.0, 27.0), 2)
        humidity = round(random.uniform(72.0, 90.0), 2)
        distance = round(random.uniform(70.0, 180.0), 2)
        sound = random.randint(35, 60)
        ir = random.randint(0, 1)
    else:
        # Random mixed baseline
        temperature = round(random.uniform(20.0, 35.0), 2)
        humidity = round(random.uniform(40.0, 80.0), 2)
        distance = round(random.uniform(10.0, 200.0), 2)
        sound = random.randint(20, 120)
        ir = random.randint(0, 1)

    return SensorPayload(
        temperature=_clamp(temperature, -20.0, 80.0),
        humidity=_clamp(humidity, 0.0, 100.0),
        distance=_clamp(distance, 0.0, 800.0),
        sound=int(_clamp(float(sound), 0.0, 130.0)),
        ir=1 if ir else 0,
    )


def expected_dashboard_hint(payload: SensorPayload) -> str:
    """Provide quick expectation hints based on frontend default thresholds."""
    hints = []
    hints.append("Temp Alert" if payload.temperature > 28 else "Temp Normal")
    hints.append("Humidity Alert" if payload.humidity > 70 else "Humidity Normal")
    hints.append("Noise Alert" if payload.sound > 50 else "Noise Normal")
    hints.append("Motion Active" if payload.ir == 1 else "Motion Quiet")
    return " | ".join(hints)


def send_payload(payload: SensorPayload) -> None:
    packet = {
        "api_key": API_KEY,
        "field1": payload.temperature,
        "field2": payload.humidity,
        "field3": payload.distance,
        "field4": payload.sound,
        "field5": payload.ir,
    }

    response = requests.get(URL, params=packet, timeout=12)
    if response.status_code == 200 and response.text.strip() != "0":
        print("Data Sent ✅")
    elif response.status_code == 200 and response.text.strip() == "0":
        print("ThingSpeak rejected update (0) - likely rate limit or invalid packet")
    else:
        print(f"Error: HTTP {response.status_code}")

    print(
        f"Temp={payload.temperature}C | Hum={payload.humidity}% | "
        f"Dist={payload.distance}cm | Sound={payload.sound} | IR={payload.ir}"
    )
    print("Expected Dashboard:", expected_dashboard_hint(payload))


def read_choice() -> Tuple[int, int]:
    print("\nSelect virtual test scenario:")
    print("1. High voice + high temperature")
    print("2. Low voice + normal temperature")
    print("3. Entry event simulation (near->clear with motion ON)")
    print("4. Exit event simulation (near->clear with motion OFF)")
    print("5. High humidity")
    print("6. Random mixed")

    mode_raw = input("Enter option number (1-6): ").strip()
    cycles_raw = input("How many updates to send? (recommended 4 to 10): ").strip()

    mode = int(mode_raw) if mode_raw.isdigit() else 6
    cycles = int(cycles_raw) if cycles_raw.isdigit() else 6
    mode = mode if 1 <= mode <= 6 else 6
    cycles = max(1, min(cycles, 20))
    return mode, cycles


def main() -> None:
    mode, cycles = read_choice()
    print("\nStarting virtual sensor publishing...")
    print("Note: ThingSpeak minimum interval is 15 seconds.")

    for count in range(cycles):
        payload = generate_data(mode, count)
        try:
            send_payload(payload)
        except Exception as exc:  # pylint: disable=broad-except
            print("Exception:", exc)

        if count < cycles - 1:
            time.sleep(15)

    print("\nCompleted virtual test run.")
    print("Next: wait one backend polling cycle (15s), then refresh dashboard.")


if __name__ == "__main__":
    main()
