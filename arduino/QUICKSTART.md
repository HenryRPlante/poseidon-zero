# Quick Start: Arduino Sketch Setup (5 Minutes)

## ⚡ Fast Path to Getting Started

### Step 1: Install Libraries (~2 minutes)
Open **Arduino IDE** and go to **Sketch → Include Library → Manage Libraries**

Search for and install these 3 libraries:
1. **DFRobot_PH** (by DFRobot)
2. **OneWire** (by Paul Stoffregen)
3. **DallasTemperature** (by Miles Burton)

Click **Install** for each, then close.

---

### Step 2: Connect Arduino to USB
1. Plug the Arduino board into your PC with a USB cable
2. Arduino IDE will detect it automatically

---

### Step 3: Load & Upload Sketch
1. In Arduino IDE: **File → Open → poseidon_sensors.ino**
2. Go to **Tools → Board** and select your Arduino type:
   - For Arduino UNO: Select **Arduino UNO**
   - For Arduino Nano: Select **Arduino Nano**
3. Go to **Tools → Port** and select the COM port (usually highest number)
4. Click the **Upload** button (→ icon)
5. Wait for compilation and upload to complete (~30 seconds)

---

### Step 4: Test the Sketch (~1 minute)
1. After upload, go to **Tools → Serial Monitor**
2. In the bottom right, set baud rate to **9600**
3. Type in the input box: `start`
4. Press Enter
5. You should see readings like:
   ```
   25.5 | 7.20 | 450 | 0.865
   22.8 | 6.95 | 480 | 0.920
   ```

---

## ✅ You're Done!

The sketch is running and detecting sensor data. You can now:

- **Type commands in Serial Monitor**:
  - `stop` - Stop readings
  - `start` - Start readings again
  - `status` - Check connection status
  - `info` - Device info
  - `help` - Show all commands

- **Check sensor readings** in real-time
- **Monitor USB connection** automatically

---

## 🔧 If Something Goes Wrong

### "Board not detected"
- Check USB cable is plugged in securely
- Try a different USB port
- Restart Arduino IDE
- Check Device Manager for COM ports (Windows)

### "Compilation error"
- Make sure all 3 libraries are installed
- Restart Arduino IDE
- Check you selected the correct board type

### "No sensor data"
- Check all sensor wires are connected correctly
- Verify baud rate is 9600 in Serial Monitor
- Type `start` command to begin readings

---

## 📚 For More Details

See these files in the `arduino/` folder:
- **README.md** - Full documentation
- **LIBRARY_INSTALLATION.md** - Detailed wiring diagrams & component list

---

**Tip**: Keep the Serial Monitor open while developing. It shows all errors and helps with debugging!

