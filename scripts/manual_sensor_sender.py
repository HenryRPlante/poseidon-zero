#!/usr/bin/env python3
"""
Simple Arduino Data Sender for Local Machine
Send sensor readings manually to the Flask server
Usage: Run on your local machine next to Arduino IDE
"""

import requests
import json
from datetime import datetime

# Configure this to match your Linux machine's IP
FLASK_SERVER = "http://localhost:5000"  # Change to your Linux machine IP if remote
ENDPOINT = f"{FLASK_SERVER}/api/sensors"

def send_sensor_data(temperature, ph, tds, ec):
    """Send sensor data to Flask server"""
    payload = {
        "data": {
            "temperature": temperature,
            "ph": ph,
            "tds": tds,
            "ec": ec,
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }
    }
    
    try:
        response = requests.post(ENDPOINT, json=payload)
        if response.status_code == 200:
            print(f"✓ Sent: Temp={temperature}°C, pH={ph}, TDS={tds}ppm, EC={ec}mS/cm")
            return True
        else:
            print(f"✗ Server error: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Connection error: {e}")
        return False

# Example usage:
if __name__ == "__main__":
    import time
    
    # Copy/paste sensor readings from Arduino IDE Serial Monitor here:
    test_data = [
        (25.5, 7.20, 450, 0.865),
        (25.6, 7.19, 452, 0.868),
        (25.7, 7.21, 448, 0.862),
    ]
    
    print(f"Sending data to {FLASK_SERVER}...")
    for temp, ph, tds, ec in test_data:
        send_sensor_data(temp, ph, tds, ec)
        time.sleep(1)
