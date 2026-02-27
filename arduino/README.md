# Arduino Sketch Setup for Poseidon Zero

## Overview
This folder contains the Arduino sketch (`poseidon_sensors.ino`) for the water quality monitoring system. The sketch:
- Runs autonomously for battery-powered deployments
- Reads pH, TDS, EC, and temperature sensors
- Sends JSON directly to your Flask server via SIM7000 LTE modem
- Keeps optional serial commands for diagnostics

## Hardware Requirements

### Arduino Board
- Arduino UNO, Nano, Mega, or compatible AVR-based board
- Recommended: Arduino MKR series for cellular modem support

### Sensors
1. **pH Sensor** (DFRobot or compatible)
   - Analog pin A1
   - Requires: `DFRobot_PH` library

2. **TDS Sensor**
   - Analog pin A0
   - Powered by 5V

3. **EC Sensor**
   - Analog pin A2
   - Powered by 5V

4. **Temperature Sensor** (DS18B20)
   - Digital pin 7
   - 1-Wire protocol
   - Requires: `DallasTemperature` & `OneWire` libraries

## Arduino IDE Setup

### Step 1: Install Libraries
In Arduino IDE, go to **Sketch → Include Library → Manage Libraries** and install:
1. `DFRobot_PH` by DFRobot (for pH sensor)
2. `OneWire` by Paul Stoffregen
3. `DallasTemperature` by Miles Burton
4. `TinyGSM` by Volodymyr Shymanskyy
5. `ArduinoHttpClient` by Arduino

### Step 2: Load the Sketch
1. Open Arduino IDE
2. File → Open → Select `poseidon_sensors.ino`
3. Select your board: **Tools → Board**
   - For Arduino UNO: Select "Arduino AVR Boards" → "Arduino UNO"
   - For Arduino MKR: Select "Arduino SAMD Boards" → "Arduino MKR1000"

### Step 3: Configure Port
1. Plug in the Arduino board via USB
2. In Arduino IDE: **Tools → Port** → Select the COM port
3. Open `poseidon_sensors.ino` and set:
   - `SERVER_HOST` (public hostname/IP of your Flask server)
   - `SERVER_PORT` (usually `5000`)
   - `SERVER_PATH` (default `/api/sensors`)
   - `APN`, `APN_USER`, `APN_PASS` for your SIM carrier
   - `BOTLETICS_PROFILE_UNO_NANO` / `BOTLETICS_PROFILE_FEATHER` for your wiring

### Step 4: Upload
1. Click the **Upload** button (→ icon) or **Ctrl+U**
2. Wait for compilation and upload to complete
3. Once successful, monitors will show "Uploaded" message

## Using the Sketch

### Serial Monitor
1. After uploading, open **Tools → Serial Monitor**
2. Set baud rate to **9600**
3. You should see the startup message

### Available Commands
Type these commands in the Serial Monitor input box:

```
start   - Begin sensor readings
stop    - Stop sensor readings
status  - Show modem/network and running status
info    - Display device information
reconnect - Force cellular reconnect
help    - List all available commands
```

### Output Format

**Standard Format** (when running):
```
25.5 | 7.20 | 450 | 0.865
22.8 | 6.95 | 480 | 0.920
```
Columns: Temp(°C) | pH | TDS(ppm) | EC(mS/cm)

**JSON Format** (optional):
```json
{"temp":25.5,"pH":7.20,"tds":450,"ec":0.865}
```

## Cellular Uplink Behavior

The sketch sends readings directly over LTE using SIM7000:

1. Boots modem and registers to network
2. Connects APN data session
3. Samples sensors every 30 seconds
4. POSTs JSON to `http://SERVER_HOST:SERVER_PORT/api/sensors`
5. Retries failed sends automatically

Note: `SERVER_HOST` must be publicly reachable from cellular networks (localhost will not work from the modem).

## Pin Configuration

| Sensor | Type | Arduino Pin | Voltage |
|--------|------|------------|---------|
| pH | Analog | A1 | 0-5V |
| TDS | Analog | A0 | 0-5V |
| EC | Analog | A2 | 0-5V |
| Temp | 1-Wire | D7 | 3.3V/5V |

## Troubleshooting

### Sensors Not Reading
- Check wiring connections
- Verify all libraries are installed
- Use Arduino IDE's Serial Monitor to check for errors
- Ensure baud rate is 9600

### USB Not Detected
- Try different USB cable
- Check device manager for "COM" ports
- Reinstall Arduino board drivers if needed
- For Mac/Linux, check `/dev/ttyUSB*` or `/dev/ttyACM*`

### Modem Cannot Connect
- Verify SIM card has active data plan
- Confirm APN values are correct for your carrier
- Check antenna connection and coverage
- Run `status` in Serial Monitor to inspect registration/GPRS state

### Library Errors
- In Arduino IDE: **Sketch → Include Library → Manage Libraries**
- Search for each library and install the latest version
- Restart Arduino IDE after installing

## Integration with Poseidon App

This sketch sends data to the same Flask endpoint already used by your app:
- Device POSTs to `/api/sensors`
- Flask receiver forwards data to the website flow as usual
- Payload includes `temperature`, `ph`, `tds`, `ec`, and optional `signalStrength`

## Next Steps

1. **Test the sketch**: Upload and verify all sensors work
2. **Configure WiFi/Cellular** (optional): Modify sketch to send HTTP responses
3. **Connect to App**: Update app config with Arduino IP address
4. **Monitor Data**: View real-time readings in the Poseidon app

---

**Questions?** Check the main project documentation in the root folder:
- `ARDUINO_INTEGRATION_GUIDE.md`
- `SENSOR_SETUP.md`
