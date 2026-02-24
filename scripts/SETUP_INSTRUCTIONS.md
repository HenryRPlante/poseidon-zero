# Setup Arduino → Ionic Live Data (EASY MODE)

## TL;DR - Just Do This

Your Arduino is sending data. You have 3 files ready to use on your **local machine**:

### Windows 🪟
1. Download: `start_arduino_sender.bat` and `arduino_to_ionic.py` from `/scripts/`
2. Put them in the same folder
3. **Double-click `start_arduino_sender.bat`**
4. Done! Ionic app will show live data

### Mac/Linux 🖥️
1. Download: `start_arduino_sender.sh` and `arduino_to_ionic.py` from `/scripts/`
2. Put them in the same folder
3. Open Terminal, navigate to that folder
4. Run: `bash start_arduino_sender.sh`
5. Done! Ionic app will show live data

---

## What Happens

```
Your Local Machine 🖥️            Dev Container Server 🌐
┌─────────────────┐              ┌──────────────────┐
│   Arduino       │──USB──→      │  Flask Server    │
│   (sending data)│              │  (port 5000)     │
└─────────────────┘              └──────────────────┘
                                         ↓
┌─────────────────┐              ┌──────────────────┐
│ Python Script   │──HTTP POST──→│  Stores Latest    │
│ (reads serial)  │              │  Sensor Data     │
└─────────────────┘              └──────────────────┘
                                         ↓
                                  Your Browser 🌐
                                  ┌──────────────┐
                                  │ Ionic App    │
                                  │ (localhost:  │
                                  │ 8100)        │
                                  │ Shows LIVE   │
                                  │ readings     │
                                  └──────────────┘
```

---

## Verify Everything Works

1. **Check Flask Server:**
   ```bash
   curl http://localhost:5000/api/sensors/last
   ```
   Should return your latest sensor data

2. **Open Ionic App:**
   ```
   http://localhost:8100
   ```
   Go to **Tab 1 (Dashboard)** → Should show live sensor readings updating every second

3. **Check Arduino Serial Monitor:**
   Arduino IDE should show:
   ```
   Temp: 25.5 °C  |  pH: 7.20  |  TDS: 450 ppm  |  EC: 0.865 mS/cm
   ```

---

## Files Created for You

| File | Use | Where |
|------|-----|-------|
| `arduino_to_ionic.py` | Main script (reads Arduino, sends to Flask) | Your local machine |
| `start_arduino_sender.bat` | Windows launcher (double-click) | Your local machine (Windows) |
| `start_arduino_sender.sh` | Mac/Linux launcher | Your local machine (Mac/Linux) |

---

## Download Instructions

You need to copy these 2 files to your local machine:
- `/scripts/arduino_to_ionic.py`
- `/scripts/start_arduino_sender.bat` (Windows) OR `/scripts/start_arduino_sender.sh` (Mac/Linux)

---

## Troubleshooting

### "Python not found"
- **Windows:** Download from https://python.org → Check "Add Python to PATH" during install
- **Mac:** `brew install python3`
- **Linux:** `sudo apt install python3`

### "No serial ports found"
- Arduino must be plugged in via USB
- Check Device Manager (Windows) or `ls /dev/tty*` (Mac/Linux)

### "Flask connection refused"
- Make sure Flask server is running in the dev container: `python server/receiver.py`
- It should show: `Running on http://0.0.0.0:5000`

### "Ionic app shows no data"
- Refresh your browser (Ctrl+R or Cmd+R)
- Check browser console (F12) for errors
- Verify Flask endpoint: `curl http://localhost:5000/api/sensors/last`

---

## Next Steps

1. ✅ Arduino sketch is uploaded
2. ✅ Flask server is running  
3. ✅ Ionic app is running
4. ⏳ **Run the Python script on your local machine**
5. ✅ Check Ionic app for live data

**You're done when:** Ionic app shows changing temperature/pH/TDS/EC values every second

---

## Support

If something breaks:
1. Stop everything (Ctrl+C on all terminals)
2. Check all 3 systems are running (Arduino IDE, Flask, Ionic)
3. Verify URLs work: 
   - `http://localhost:5000/api/sensors/last` (Flask)
   - `http://localhost:8100` (Ionic)
4. Re-run the Python script

