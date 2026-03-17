#!/usr/bin/env python3
"""
Populate the Flask backend with 10 minutes of test sensor data
"""
import requests
import json
from datetime import datetime, timedelta
import random

BASE_URL = "http://localhost:5000"

# Generate 10 minutes of data (1 reading every 30 seconds = 20 readings)
readings = []
end_time = datetime.now()
start_time = end_time - timedelta(minutes=10)

for i in range(20):
    timestamp = start_time + timedelta(seconds=i * 30)
    
    # Generate realistic varying sensor data
    reading = {
        "ph": round(7.0 + random.uniform(-0.5, 0.5), 2),
        "temperature": round(22.0 + random.uniform(-2, 3), 2),
        "tds": round(150 + random.uniform(-20, 30), 1),
        "ec": round(0.3 + random.uniform(-0.05, 0.08), 3),
        "turbidity": round(5.0 + random.uniform(-1, 2), 2),
        "salinity": round(0.1 + random.uniform(-0.02, 0.03), 3),
        "signalStrength": round(-70 + random.uniform(-10, 10), 1),
        "batteryLevel": round(85 + random.uniform(-5, 5), 1),
        "timestamp": timestamp.isoformat() + "Z"
    }
    readings.append(reading)
    
    # Send to backend
    try:
        response = requests.post(
            f"{BASE_URL}/api/sensors",
            json=reading,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            print(f"✓ Sent reading {i+1}/20 for {timestamp.strftime('%H:%M:%S')}")
        else:
            print(f"✗ Failed to send reading {i+1}: {response.status_code}")
    except Exception as e:
        print(f"✗ Error sending reading {i+1}: {e}")

print("\n" + "="*60)
print(f"Sent {len(readings)} readings covering 10 minutes")
print(f"Time range: {start_time.strftime('%H:%M:%S')} to {end_time.strftime('%H:%M:%S')}")
print("="*60)

# Verify last reading
try:
    response = requests.get(f"{BASE_URL}/api/sensors/last")
    if response.status_code == 200:
        data = response.json()
        print("\nLast reading in backend:")
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"\n✗ Could not verify: {e}")
