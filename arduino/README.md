# Arduino Sketch Setup for Poseidon Zero

## Overview
This folder contains the Arduino sketch (`poseidon_sensors.ino`) for the water quality monitoring system. The sketch:
- Detects USB connection automatically
- Reads pH, TDS, EC, and temperature sensors
- Outputs data in both formatted and JSON formats
- Handles serial commands for control

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

### Step 2: Load the Sketch
1. Open Arduino IDE
2. File → Open → Select `poseidon_sensors.ino`
3. Select your board: **Tools → Board**
   - For Arduino UNO: Select "Arduino AVR Boards" → "Arduino UNO"
   - For Arduino MKR: Select "Arduino SAMD Boards" → "Arduino MKR1000"

### Step 3: Configure Port
1. Plug in the Arduino board via USB
2. In Arduino IDE: **Tools → Port** → Select the COM port
3. The sketch will automatically detect USB connection

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
start   - Begin sensor readings (outputs every 1 second)
stop    - Stop sensor readings
status  - Show USB connection and running status
info    - Display device information
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

## USB Detection Behavior

The sketch automatically detects USB connection:

1. **Plugged In**: Serial port opens, device is ready
2. **Disconnected**: Serial closes, device goes idle
3. **Commands Only Work**: When USB is connected
4. **Auto Start**: Disabled by default (must send "start" command)

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

### Library Errors
- In Arduino IDE: **Sketch → Include Library → Manage Libraries**
- Search for each library and install the latest version
- Restart Arduino IDE after installing

## Integration with Poseidon App

This sketch outputs data compatible with the Poseidon Zero app:
- The app polls `/api/sensors` endpoint (requires WiFi/cellular modem)
- For now, monitor data via Serial Monitor
- TODO: Add HTTP server support for future versions

## Next Steps

1. **Test the sketch**: Upload and verify all sensors work
2. **Configure WiFi/Cellular** (optional): Modify sketch to send HTTP responses
3. **Connect to App**: Update app config with Arduino IP address
4. **Monitor Data**: View real-time readings in the Poseidon app

---

**Questions?** Check the main project documentation in the root folder:
- `ARDUINO_INTEGRATION_GUIDE.md`
- `SENSOR_SETUP.md`
