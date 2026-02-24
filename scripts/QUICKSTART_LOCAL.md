# Quick Start: Arduino → App (5 Minutes)

## What You Have Running ✓
- **Flask Server**: Running in Linux container on `localhost:5000`
- **Ionic App**: Running with `ionic serve`
- **Arduino**: Plugged into your local machine with temp/pH/TDS/EC data

## What's Missing
Arduino data is on your LOCAL machine, but Flask expects it from there.

---

## Option 1: Run Serial Reader on Local Machine (Recommended)

### On Your Local Computer:

**1. Copy the script:**
Download from your dev container: `/scripts/arduino_reader_LOCAL.py`

**2. Install Python (if not already):**
```bash
# Windows: Download from python.org
# Mac: brew install python3
# Linux: sudo apt install python3 python3-pip
```

**3. Install dependencies:**
```bash
pip install pyserial requests
```

**4. Run it:**
```bash
python arduino_reader_LOCAL.py
```

**You should see:**
```
✓ Using port: COM3
✓ Connected to Arduino on COM3
✓ 25.5°C | pH 7.20 | 450ppm | 0.865mS/cm
✓ 25.5°C | pH 7.20 | 450ppm | 0.865mS/cm
```

---

## Option 2: Manually Send Data

If you don't want to run Python, you can manually send readings from Arduino IDE Serial Monitor:

```bash
# On your local machine with Arduino data:
curl -X POST http://localhost:5000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{"data":{"temperature":25.5,"ph":7.20,"tds":450,"ec":0.865}}'
```

Copy readings from Arduino IDE and paste them in.

---

## Verify it's Working

**Check Flask received the data:**
```bash
curl http://localhost:5000/api/sensors/last
```

**Check Ionic app:**
- Open: `http://localhost:4200`
- Go to **Tab 1 (Dashboard)**
- You should see **live sensor readings** updating

---

## Checklist

- [ ] Arduino Serial monitor shows: `Temp | pH | TDS | EC`
- [ ] Flask endpoint works: `curl http://localhost:5000/api/sensors/last`
- [ ] Running serial reader OR manually sending data
- [ ] Ionic app shows live readings on dashboard

---

## Troubleshooting

**"Connection refused"**
- Make sure Flask is running: `python server/receiver.py`

**"No Arduino detected"**
- Run: `python -m serial.tools.list_ports` to see available ports
- Specify port: `python arduino_reader_LOCAL.py COM3`

**"Ionic app shows no data"**
- Check: `curl http://localhost:5000/api/sensors/last` returns data
- Refresh the Ionic app browser window
- Open browser DevTools (F12) to check for network errors

