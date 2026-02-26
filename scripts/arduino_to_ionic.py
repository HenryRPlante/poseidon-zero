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
import os
from urllib.parse import urlparse
from datetime import datetime, timezone

DEFAULT_SCHEME = os.getenv("FLASK_SCHEME", "http")
DEFAULT_HOST = os.getenv("FLASK_HOST", "localhost")
DEFAULT_PORT = os.getenv("FLASK_PORT", "5000")
DEFAULT_PATH = os.getenv("FLASK_PATH", "/api/sensors")
DEFAULT_HEALTH_PATH = os.getenv("FLASK_HEALTH_PATH", "/api/sensors/last")
FIXED_CODESPACE_FLASK_URL = "https://redesigned-adventure-5gr47r6g64w63pp74-5000.app.github.dev/api/sensors"

if not DEFAULT_PATH.startswith("/"):
    DEFAULT_PATH = f"/{DEFAULT_PATH}"

if not DEFAULT_HEALTH_PATH.startswith("/"):
    DEFAULT_HEALTH_PATH = f"/{DEFAULT_HEALTH_PATH}"


def _build_url(base: str, path: str) -> str:
    base = base.strip().rstrip("/")
    if not path.startswith("/"):
        path = f"/{path}"
    return f"{base}{path}"


def _candidate_urls():
    candidates = []

    candidates.append(FIXED_CODESPACE_FLASK_URL)

    explicit_url = os.getenv("FLASK_URL", "").strip()
    if explicit_url:
        candidates.append(explicit_url)

    explicit_host = os.getenv("FLASK_HOST", "").strip()
    if explicit_host:
        candidates.append(f"{DEFAULT_SCHEME}://{explicit_host}:{DEFAULT_PORT}{DEFAULT_PATH}")

    for env_name in ("IONIC_URL", "APP_URL", "PUBLIC_APP_URL"):
        app_url = os.getenv(env_name, "").strip()
        if not app_url:
            continue
        parsed = urlparse(app_url)
        if not parsed.scheme or not parsed.netloc:
            continue
        host = parsed.netloc
        if "-810" in host:
            host = host.replace("-8101", "-5000").replace("-8100", "-5000")
            candidates.append(_build_url(f"{parsed.scheme}://{host}", DEFAULT_PATH))

    codespace = os.getenv("CODESPACE_NAME", "").strip()
    domain = os.getenv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "").strip()
    if codespace and domain:
        candidates.append(f"https://{codespace}-5000.{domain}{DEFAULT_PATH}")
    if codespace:
        candidates.append(f"https://{codespace}-5000.app.github.dev{DEFAULT_PATH}")

    candidates.extend([
        f"http://localhost:{DEFAULT_PORT}{DEFAULT_PATH}",
        f"http://127.0.0.1:{DEFAULT_PORT}{DEFAULT_PATH}",
        f"http://host.docker.internal:{DEFAULT_PORT}{DEFAULT_PATH}"
    ])

    deduped = []
    seen = set()
    for url in candidates:
        normalized = url.strip().rstrip("/")
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        deduped.append(normalized)
    return deduped


def _probe_url(post_url: str) -> bool:
    try:
        parsed = urlparse(post_url)
        if not parsed.scheme or not parsed.netloc:
            return False
        health_url = _build_url(f"{parsed.scheme}://{parsed.netloc}", DEFAULT_HEALTH_PATH)
        response = requests.get(health_url, timeout=1.5)
        return response.status_code in (200, 204)
    except requests.RequestException:
        return False


def _resolve_flask_url() -> str:
    for candidate in _candidate_urls():
        if _probe_url(candidate):
            return candidate
    return f"http://{DEFAULT_HOST}:{DEFAULT_PORT}{DEFAULT_PATH}"

FLASK_URL = _resolve_flask_url()
BAUD_RATE = 9600

print("\n" + "="*70)
print("Arduino → Ionic Bridge (Automatic)")
print("="*70)
print(f"Flask Server (auto): {FLASK_URL}")
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
                print(f"   Check: {DEFAULT_HEALTH_PATH}")
                print("   Tip: set FLASK_URL if auto-detect picked the wrong endpoint")
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
