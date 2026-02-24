#!/usr/bin/env python3
"""
Standalone Arduino Serial Reader for Local Machine
Run this on your LOCAL computer (where Arduino is plugged in)
This sends sensor data to the Flask server on the dev container
"""

import serial
import requests
import time
import sys
import json
from datetime import datetime

# ============ CONFIGURATION ============
# If Flask is on a different IP/machine, change this:
FLASK_SERVER_URL = "http://localhost:5000/api/sensors"

# Arduino settings
BAUD_RATE = 9600
TIMEOUT = 2

print("=" * 60)
print("Arduino Serial Reader - Standalone")
print("=" * 60)
print(f"Flask Server: {FLASK_SERVER_URL}")
print()

# Find Arduino port
try:
    import serial.tools.list_ports
    ports = serial.tools.list_ports.comports()
    
    arduino_port = None
    for port in ports:
        print(f"Found port: {port.device} - {port.description}")
        if 'Arduino' in port.description or 'CH340' in port.description or 'USB' in port.description:
            arduino_port = port.device
            break
    
    if not arduino_port and ports:
        arduino_port = ports[0].device
        print(f"⚠ No Arduino detected by name, trying first port: {arduino_port}")
    
    if not arduino_port:
        print("✗ No serial ports found!")
        sys.exit(1)
    
    print(f"✓ Using port: {arduino_port}\n")
    
except Exception as e:
    print(f"Error detecting port: {e}")
    sys.exit(1)

# Connect to Arduino
try:
    ser = serial.Serial(arduino_port, BAUD_RATE, timeout=TIMEOUT)
    print(f"✓ Connected to Arduino on {arduino_port}")
    time.sleep(2)  # Wait for Arduino to reset
    
except serial.SerialException as e:
    print(f"✗ Failed to connect: {e}")
    sys.exit(1)

# Send start command
ser.write(b"start\n")
time.sleep(0.5)
print("Sent 'start' command to Arduino")
print("-" * 60)

# Main loop
try:
    while True:
        line = ser.readline().decode().strip()
        
        if not line:
            continue
        
        # Skip control messages
        if line.startswith('['):
            print(f"[Arduino] {line}")
            continue
        
        # Skip headers
        if 'Temp' in line or '---' in line:
            continue
        
        # Parse sensor data: "25.5 | 7.20 | 450 | 0.865"
        try:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) == 4:
                temperature = float(parts[0])
                ph = float(parts[1])
                tds = float(parts[2])
                ec = float(parts[3])
                
                # Send to Flask
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
                    response = requests.post(FLASK_SERVER_URL, json=payload, timeout=5)
                    if response.status_code == 200:
                        print(f"✓ {temperature}°C | pH {ph} | {tds}ppm | {ec}mS/cm")
                    else:
                        print(f"⚠ Server returned {response.status_code}")
                except Exception as e:
                    print(f"✗ Send failed: {e}")
        
        except (ValueError, IndexError):
            pass

except KeyboardInterrupt:
    print("\n\nStopping...")
    ser.write(b"stop\n")
    ser.close()
    print("✓ Serial connection closed")
