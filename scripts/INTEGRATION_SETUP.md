# Arduino → Flask → Ionic App Integration Setup

## Overview

Your system now has all the pieces to connect Arduino sensor data to the Ionic app:

```
Arduino (USB)
    ↓
Serial Data (temp | pH | TDS | EC)
    ↓
📄 arduino_serial_reader.py ← **NEW**
    ↓
HTTP POST to Flask
    ↓
🌐 Flask Server (localhost:5000)
    ↓
📱 Ionic App Polls /api/sensors
    ↓
📊 Dashboard Shows Live Data
```

---

## Step 1: Install Dependencies

```bash
cd /workspaces/poseidon-zero
source .venv/bin/activate
pip install -r server/requirements.txt
```

This installs:
- `flask` - Web server
- `flask-cors` - Cross-origin requests
- `pyserial` - Read Arduino serial data
- `requests` - HTTP client

---

## Step 2: Prepare Hardware

1. **Connect Arduino to USB** on the same machine
2. **Upload the Arduino sketch** (from `arduino/poseidon_sensors.ino`)
3. Keep Arduino powered on

---

## Step 3: Start the Services

### Option A: Quick Start (Automated)
```bash
bash scripts/start_all.sh
```
This runs everything in the right order.

### Option B: Manual (Better for Debugging)

**Terminal 1 - Flask Server:**
```bash
cd /workspaces/poseidon-zero
source .venv/bin/activate
python server/receiver.py
```
You should see:
```
 * Running on http://0.0.0.0:5000
```

**Terminal 2 - Arduino Serial Reader:**
```bash
cd /workspaces/poseidon-zero
source .venv/bin/activate
python scripts/arduino_serial_reader.py
```
You should see:
```
✓ Connected to Arduino on COM3 at 9600 baud
Starting sensor reader...
Sent 'start' command to Arduino
✓ Data sent: Temp=25.5°C, pH=7.20, TDS=450ppm, EC=0.865mS/cm
✓ Data sent: Temp=25.5°C, pH=7.20, TDS=450ppm, EC=0.865mS/cm
```

---

## Step 4: Verify Data Flow

**Terminal 3 - Test the API:**
```bash
# Get latest sensor reading
curl http://localhost:5000/api/sensors/last

# Should return:
{
  "success": true,
  "data": {
    "temperature": 25.5,
    "ph": 7.20,
    "tds": 450.0,
    "ec": 0.865,
    "timestamp": "2026-02-24T10:30:45.123456Z"
  },
  "timestamp": "2026-02-24T10:30:45.123456Z"
}
```

---

## Step 5: Run the Ionic App

```bash
cd /workspaces/poseidon-zero
ionic serve
```

The app should now:
- ✅ Display live sensor readings on the dashboard
- ✅ Show device status
- ✅ Log historical data
- ✅ Perform analysis

---

## Configuration

### Specify Arduino Port (if auto-detect fails)

```bash
# List available ports
python -m serial.tools.list_ports

# Run with specific port
python scripts/arduino_serial_reader.py COM3
# or on Linux/Mac
python scripts/arduino_serial_reader.py /dev/ttyUSB0
```

### Change Flask Server Port

Edit `server/receiver.py`:
```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)  # Change 5000 to your port
```

---

## Troubleshooting

### "No Arduino detected"
- Ensure Arduino is connected via USB
- Check Device Manager (Windows) or `/dev/ttyUSB*` (Linux/Mac)
- Run with explicit port: `python scripts/arduino_serial_reader.py COM3`

### "Failed to connect to Flask"
- Make sure `python server/receiver.py` is running in another terminal
- Check that port 5000 is not blocked by firewall

### "Could not decode serial data"
- Arduino may be sending corrupted data
- Verify Serial Monitor in Arduino IDE shows clean output
- Check baud rate is 9600

### "No data in Ionic app"
- Check Flask server is receiving POST requests
- Use `curl` to test `/api/sensors/last` endpoint
- Verify Ionic app is configured to use `localhost:5000`

---

## Files Created

| File | Purpose |
|------|---------|
| `scripts/arduino_serial_reader.py` | Reads Arduino serial, sends to Flask |
| `scripts/start_all.sh` | Automated startup script |
| `server/receiver.py` | Flask HTTP API (already existed) |
| `arduino/poseidon_sensors.ino` | Arduino sketch |

---

## API Endpoints

The Flask server exposes:

**GET /api/sensors/last**
- Returns latest sensor reading
- No authentication needed

**POST /api/sensors**
- Receives new sensor data
- Called by `arduino_serial_reader.py`

---

## Next Steps

1. ✅ Upload Arduino sketch
2. ✅ Install Python dependencies
3. ✅ Start Flask server + serial reader
4. ✅ Verify data flow with curl
5. ✅ Run Ionic app
6. ✅ View live data on dashboard

**Questions?** Check the main documentation:
- `SENSOR_SETUP.md` - Full setup guide
- `ARDUINO_INTEGRATION_GUIDE.md` - Arduino integration details

