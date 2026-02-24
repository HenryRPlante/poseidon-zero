#!/usr/bin/env python3
"""
Arduino to Ionic Bridge - Automatic Setup
Reads Arduino serial data and sends to Flask/Ionic
Just run this on your local machine where Arduino is plugged in
"""

import serial
import requests
import time
import sys
import re
from datetime import datetime, timezone
from pathlib import Path

FLASK_URL = "https://psychic-cod-695rx5696pqqf4p5r-5000.app.github.dev/api/sensors"
BAUD_RATE = 9600

print("\n" + "="*70)
print("Arduino → Ionic Bridge (Automatic)")
print("="*70)
print(f"Flask Server: {FLASK_URL}")
print(f"Baud Rate: {BAUD_RATE}")
print("="*70 + "\n")

# Auto-detect Arduino port
print("Searching for Arduino...")
try:
    import serial.tools.list_ports
    ports = list(serial.tools.list_ports.comports())
    
    if not ports:
        print("❌ No serial ports found!")
        print("Make sure Arduino is connected via USB.")
        sys.exit(1)
    
    arduino_port = None
    for port in ports:
        print(f"   Found: {port.device} ({port.description})")
        if 'Arduino' in port.description or 'CH340' in port.description:
            arduino_port = port.device
            break
    
    if not arduino_port:
        arduino_port = ports[0].device
        print(f"\n✓ Using port: {arduino_port}")
    else:
        print(f"\n✓ Using Arduino: {arduino_port}")
    
except Exception as e:
    print(f"❌ Error detecting ports: {e}")
    sys.exit(1)

# Connect to Arduino
print(f"Connecting to {arduino_port}...")
try:
    ser = serial.Serial(arduino_port, BAUD_RATE, timeout=2)
    print("✓ Connected!\n")
    time.sleep(2)
except serial.SerialException as e:
    print(f"❌ Failed to connect: {e}")
    sys.exit(1)

# Send start command
print("Starting Arduino sensor readings...")
ser.write(b"start\n")
time.sleep(1)

print("-"*70)
print("Reading Arduino data and sending to Ionic app...")
print("(Press Ctrl+C to stop)\n")

# Main loop
failed_count = 0
try:
    while True:
        try:
            line = ser.readline().decode().strip()
            
            if not line:
                continue
            
            # Skip control messages
            if line.startswith('['):
                continue
            
            # Parse Arduino format: "Temp: 8.19 °C  |  pH: -1.30  |  TDS: 0 ppm  |  EC: 0.000 mS/cm"
            # Or format: "25.5 | 7.20 | 450 | 0.865"
            try:
                # Try parsing with labels first
                if "Temp:" in line and "pH:" in line:
                    # Extract numbers from labeled format
                    temp_match = re.search(r'Temp:\s*([-\d.]+)', line)
                    ph_match = re.search(r'pH:\s*([-\d.]+)', line)
                    tds_match = re.search(r'TDS:\s*([-\d.]+)', line)
                    ec_match = re.search(r'EC:\s*([-\d.]+)', line)
                    
                    if all([temp_match, ph_match, tds_match, ec_match]):
                        temperature = float(temp_match.group(1))
                        ph = float(ph_match.group(1))
                        tds = float(tds_match.group(1))
                        ec = float(ec_match.group(1))
                    else:
                        continue
                else:
                    # Try parsing simple pipe format: "25.5 | 7.20 | 450 | 0.865"
                    parts = [p.strip() for p in line.split('|')]
                    if len(parts) != 4:
                        continue
                    temperature = float(parts[0])
                    ph = float(parts[1])
                    tds = float(parts[2].split()[0])  # Remove "ppm" if present
                    ec = float(parts[3].split()[0])   # Remove "mS/cm" if present
                
                # Send to Flask
                payload = {
                    "data": {
                        "temperature": round(temperature, 1),
                        "ph": round(ph, 2),
                        "tds": round(tds, 0),
                        "ec": round(ec, 3),
                        "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
                    }
                }
                
                response = requests.post(FLASK_URL, json=payload, timeout=3)
                
                if response.status_code == 200:
                    print(f"✓ Temp: {temperature:6.1f}°C | pH: {ph:5.2f} | TDS: {tds:5.0f}ppm | EC: {ec:6.3f}mS/cm")
                    failed_count = 0
                else:
                    print(f"⚠ Flask error: {response.status_code}")
                    failed_count += 1
                    
            except (ValueError, IndexError, AttributeError) as parse_error:
                pass
            
            # Check for connection issues
            if failed_count > 5:
                print("❌ Too many failed sends. Is Flask running?")
                print(f"   Check: http://localhost:5000/api/sensors/last")
                failed_count = 0
        
        except UnicodeDecodeError:
            pass
        except Exception as e:
            print(f"⚠ Error: {e}")

except KeyboardInterrupt:
    print("\n\nStopping...")
    ser.write(b"stop\n")
    time.sleep(0.5)
    ser.close()
    print("✓ Serial connection closed")
    print("\nDone! Check your Ionic app at: http://localhost:8100")
    sys.exit(0)
except Exception as e:
    print(f"\n❌ Fatal error: {e}")
    ser.close()
    sys.exit(1)
