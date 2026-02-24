# Arduino Library Installation & Wiring Guide

## Required Libraries

### 1. DFRobot_PH Library
**Publisher**: DFRobot  
**Version**: >= 1.0.0  
**Installation Path**: Arduino IDE → Sketch → Include Library → Manage Libraries  
**Search for**: `DFRobot_PH`  
**GitHub**: https://github.com/DFRobot/DFRobot_PH

#### Installation Steps:
1. Open Arduino IDE
2. Go to **Sketch → Include Library → Manage Libraries**
3. Type `DFRobot_PH` in search box
4. Click the DFRobot_PH library by DFRobot
5. Click **Install**
6. Click **Close**

### 2. OneWire Library
**Publisher**: Paul Stoffregen  
**Version**: >= 2.3.5  
**Installation**: Built-in to Arduino IDE  
**GitHub**: https://github.com/PaulStoffregen/OneWire

#### Installation Steps:
1. Go to **Sketch → Include Library → Manage Libraries**
2. Type `OneWire` in search box
3. Select **OneWire by Paul Stoffregen**
4. Click **Install**
5. Click **Close**

### 3. DallasTemperature Library
**Publisher**: Miles Burton  
**Version**: >= 3.9.0  
**Dependency**: OneWire library (required separately)  
**GitHub**: https://github.com/milesburton/Arduino-Temperature-Control-Library

#### Installation Steps:
1. Go to **Sketch → Include Library → Manage Libraries**
2. Type `DallasTemperature` in search box
3. Select **DallasTemperature by Miles Burton**
4. Click **Install** (will auto-install OneWire if needed)
5. Click **Close**

---

## Hardware Wiring Diagram

### Analog Sensors

```
Arduino UNO / Nano
         ┌─────────────────┐
         │    A0  A1  A2   │
         │     |  |   |    │
         │     |  |   |    │
    ┌────┤ 5V  |  |   |    │
    │    │     |  |   |    │
    │ ┌──┤ GND |  |   |    │
    │ │  │     |  |   |    │
    │ │  └─────────────────┘
    │ │      
    │ │      TDS Sensor    pH Sensor      EC Sensor
    │ │      ┌─────────┐   ┌──────────┐  ┌─────────┐
    │ ├─────┤ A0 (red) ├──┤ A1 (red) ├─┤ A2 (red)├─ 5V
    │ │     └─────┬────┘   └──────┬───┘  └────┬────┘
    │ │           │               │           │
    │ └───────────┼───────────────┼───────────┘ GND
    │             │               │
    └─────────────┴───────────────┴─ GND
```

### Digital Sensor (Temperature - DS18B20)

```
Arduino UNO / Nano
         ┌──────────────────┐
         │                  │
         │  D7  D6  D5  D4  │
         │  │   (GND)(5V)   │
         │  │               │
    ┌────┤ 5V              │
    │    │  │               │
    │ ┌──┤ GND──────────────┴─ GND
    │ │  │                  │
    │ │  └──────────────────┘
    │ │
    │ │    DS18B20 Temperature Sensor
    │ │    (TO-92 package)
    │ │    ┌─────────┐
    │ ├───┤1(Red)  ├─ +5V with 4.7kΩ pullup
    │ │   │ (DQ)   │
    │ │   ├─────────┤
    │ │   │2(Black)├─ GND
    │ │   │ (GND)  │
    │ │   ├─────────┤
    │ └───┤3(White)├─ D7 (Data)
    │     │ (DQ)   │
    │     └─────────┘
    │
   4.7kΩ Pullup Resistor
    │     (connects between D7 and 5V)
    └─────────────────────────
```

---

## Pin Summary Table

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SENSOR          TYPE        ARDUINO PIN    VOLTAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pH Sensor       Analog      A1             0-5V
TDS Sensor      Analog      A0             0-5V
EC Sensor       Analog      A2             0-5V
Temperature     1-Wire      D7             3.3V-5V*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
* DS18B20 can run on 3.3V or 5V with proper resistor
```

---

## Component Checklist

### Essential Components
- [ ] Arduino board (UNO, Nano, or compatible)
- [ ] USB cable (for programming and power)
- [ ] Breadboard or perfboard (optional, for testing)
- [ ] Jumper wires
- [ ] 1× 4.7kΩ resistor (for DS18B20 pullup)

### Sensors
- [ ] pH sensor module with analog output
- [ ] TDS sensor module with analog output
- [ ] EC sensor probe with analog module
- [ ] DS18B20 temperature sensor (waterproof recommended)

### Power
- [ ] 5V power supply (500mA minimum)
- [ ] USB power (for development)

---

## Verification Checklist

After wiring everything:

1. **Visual Check**
   - [ ] All sensors firmly connected
   - [ ] No loose wires
   - [ ] Correct pins matched in code

2. **Upload Test**
   - [ ] Arduino IDE detects board
   - [ ] Sketch uploads without errors
   - [ ] Serial Monitor shows startup message

3. **Sensor Test**
   - [ ] Open Serial Monitor (9600 baud)
   - [ ] Type: `start`
   - [ ] Each second should show new readings
   - [ ] Values should be in expected ranges:
     - pH: 0-14
     - TDS: 0-1000+ ppm
     - EC: 0-5+ mS/cm
     - Temp: -55 to +125°C

4. **Troubleshooting**
   - [ ] If no data: Check Serial Monitor baud rate (9600)
   - [ ] If sensor reads 0: Check wiring and power
   - [ ] If temperature error: Verify DS18B20 pinout

---

## Tips

1. **Testing without sensors**: The code works without sensors - you'll get 0 or random ADC values
2. **pH sensor calibration**: DFRobot library includes EEPROM calibration utility
3. **Temperature accuracy**: Place DS18B20 in water for accurate readings
4. **Cable length**: Keep sensor cables < 2 meters to avoid noise
5. **Ground**: Ensure all sensors share common ground with Arduino

---

## Safety Notes

⚠️ **Water Safety**: 
- Sensors are waterproof, but Arduino board is NOT
- Keep Arduino at least 50cm away from water
- Use proper enclosure for outdoor deployment

⚠️ **Power**:
- Don't exceed 5V to analog inputs
- Use proper USB power supply
- Add inline fuse (500mA) for safety

---

## Next Steps

1. Gather all components
2. Install libraries in Arduino IDE
3. Wire sensors to Arduino (use diagram above)
4. Upload `poseidon_sensors.ino`
5. Open Serial Monitor and test with `start` command
6. Check [README.md](README.md) for full documentation

