# Arduino Sensor Integration Guide

## Overview
This guide explains how to set up your Ionic Angular app to receive sensor data from Arduino devices with cellular modems.

## Supported Sensors
- **TDS Sensor** (Total Dissolved Solids Meter) - Measures ppm (parts per million)
- **Temperature Sensor** (DS18B20) - Waterproof digital temperature sensor
- **EC Sensor** (Electrical Conductivity) - Measures water conductivity in mS/cm
- **pH Meter** - Measures pH level (0-14)

## Arduino Setup Requirements

### Hardware
1. Arduino board with cellular modem (e.g., Arduino MKR NB-IoT, Arduino MKR Cellular)
2. TDS sensor module
3. DS18B20 waterproof temperature sensor
4. EC sensor probe
5. pH sensor probe
6. Required resistors and connectors

### Arduino Code Structure
Your Arduino firmware should expose HTTP endpoints:

```
GET /api/sensors  -> Returns current sensor readings
GET /api/info     -> Returns device information
```

### Expected JSON Response Format
The Arduino device should respond to `/api/sensors` with:

```json
{
  "success": true,
  "data": {
    "timestamp": "2026-02-13T09:32:00.000Z",
    "tds": 450.5,
    "temperature": 22.4,
    "ec": 0.8,
    "ph": 7.2,
    "signalStrength": -72,
    "batteryLevel": 87
  },
  "timestamp": "2026-02-13T09:32:00.000Z"
}
```

## App Integration Steps

### 1. Initialize Sensor Devices
In your main component (e.g., `AppComponent`), initialize your devices:

```typescript
import { SensorDataService } from './services/sensor-data.service';
import { SensorDevice } from './models/sensor-data.model';

constructor(private sensorDataService: SensorDataService) {
  this.initializeSensors();
}

initializeSensors() {
  const devices: SensorDevice[] = [
    {
      id: 'device-1',
      name: 'Buoy 1',
      ipAddress: '192.168.1.100',  // IP of your Arduino (via cellular modem)
      port: 8080,                   // HTTP server port on Arduino
      location: {
        latitude: 41.40338,
        longitude: 2.17403,
        name: 'Barcelona Harbor'
      },
      lastSync: new Date(),
      status: 'online'
    },
    {
      id: 'device-2',
      name: 'Buoy 2',
      ipAddress: '192.168.1.101',
      port: 8080,
      location: {
        latitude: 41.38783,
        longitude: 2.16999,
        name: 'Montjuïc'
      },
      lastSync: new Date(),
      status: 'online'
    }
  ];

  this.sensorDataService.initializeDevices(devices);
}
```

### 2. Start Polling for Data
To start receiving sensor data, subscribe to the polling observable:

```typescript
// In your component where you want live data
constructor(private sensorDataService: SensorDataService) {}

ngOnInit() {
  // Start polling data from device every 5 seconds
  this.sensorDataService.startPolling('device-1', 5000)
    .subscribe({
      next: (reading) => {
        console.log('New sensor reading:', reading);
      },
      error: (error) => {
        console.error('Error fetching sensor data:', error);
      }
    });
}
```

### 3. Access Current Reading
Get the latest reading at any time:

```typescript
const currentReading = this.sensorDataService.getCurrentReading();
console.log('Temperature:', currentReading?.temperature);
console.log('pH:', currentReading?.ph);
```

### 4. Store Trial Data
Save a collection of readings as a trial:

```typescript
const trialData: HistoricalData = {
  trialId: 'trial_' + Date.now(),
  trialName: 'Field Test #1',
  readings: this.sensorDataService.getReadingsHistory(),
  startTime: new Date(),
  endTime: new Date(),
  location: 'Barcelona Harbor'
};

this.sensorDataService.saveTrialData(trialData);
```

## Accessing Data in Components

### Tab 1 - Dashboard
- Shows live device status
- Displays current sensor readings
- Shows device location on map
- Battery and signal strength indicators

### Tab 2 - Data
- View current live sensor data
- Access stored trial data
- Export data as CSV
- Review readings history

### Tab 3 - Analysis
- Statistical analysis of sensor data
- Linear regression analysis
- Min/Max/Average calculations
- Export analysis reports as text

## Data Storage

All data is stored locally using browser's `localStorage`:
- `sensorDevices` - Device configurations
- `sensorReadingsHistory` - Recent sensor readings (up to 100)
- `sensorTrialsData` - Stored trial data

This ensures data persistence across app sessions.

## API Reference

### SensorDataService Methods

#### Initialize Devices
```typescript
initializeDevices(devices: SensorDevice[]): void
```

#### Add a New Device
```typescript
addDevice(device: SensorDevice): void
```

#### Start Polling
```typescript
startPolling(deviceId: string, interval?: number): Observable<SensorReading>
```

#### Fetch Single Reading
```typescript
fetchSensorData(deviceId: string): Observable<SensorReading>
```

#### Fetch All Devices
```typescript
fetchAllSensorData(): Observable<Map<string, SensorReading>>
```

#### Get Current Reading
```typescript
getCurrentReading(): SensorReading | null
```

#### Get Readings History
```typescript
getReadingsHistory(): SensorReading[]
```

#### Save Trial Data
```typescript
saveTrialData(trialData: HistoricalData): void
```

#### Get Trial Data
```typescript
getTrialData(): HistoricalData[]
```

#### Set Polling Interval
```typescript
setPollingInterval(interval: number): void
```

## Common Issues & Troubleshooting

### Device Status Shows "Offline"
- Check Arduino device is powered and connected to cellular network
- Verify IP address and port are correct
- Check firewall settings allow HTTP traffic
- Ensure Arduino HTTP server is running

### No Data Displayed
- Verify Arduino firmware returns JSON in expected format
- Check browser console for HTTP error messages
- Ensure SensorDevice configuration is correct
- Check Arduino device responds to GET /api/sensors

### High Latency/Slow Updates
- Increase polling interval to reduce server load
- Check cellular network signal strength
- Consider using WebSockets instead of HTTP polling for real-time data

## Extending the Service

### Add Additional Sensor Types
Update `SensorReading` interface in `sensor-data.model.ts`:

```typescript
export interface SensorReading {
  // ... existing fields
  turbidity?: number;  // Add new sensor
  salinity?: number;   // Add new sensor
}
```

### Custom Statistics
Add methods to `Tab3Page` for specialized analysis:

```typescript
calculateCustomMetric() {
  // Your custom analysis logic
}
```

## Arduino Example Sketch (Pseudocode)

```cpp
#include <GSM.h>  // Or your cellular library
#include <ArduinoJson.h>

// Pin definitions
const int TDS_PIN = A0;
const int TEMP_PIN = 2;
const int EC_PIN = A1;
const int PH_PIN = A2;

GSMServer server(8080);
GSMClient client;

void setup() {
  // Initialize cellular connection
  // Setup sensors
  server.begin();
}

void sendSensorData() {
  if (client.available() > 0) {
    StaticJsonDocument<256> doc;
    
    doc["success"] = true;
    doc["data"]["timestamp"] = getISO8601Time();
    doc["data"]["tds"] = readTDS();
    doc["data"]["temperature"] = readTemperature();
    doc["data"]["ec"] = readEC();
    doc["data"]["ph"] = readPH();
    doc["data"]["signalStrength"] = getSignalStrength();
    doc["data"]["batteryLevel"] = getBatteryLevel();
    
    serializeJson(doc, client);
  }
}

float readTDS() {
  // Read analog value and convert to ppm
  return (rawValue / 4095.0) * 1000.0;
}

// ... other sensor read functions
```

## Next Steps

1. Configure your Arduino device IP address and port
2. Ensure Arduino firmware responds with correct JSON format
3. Test connection from browser console
4. Start polling for live data
5. Store and analyze trial data

For more information, see the component source files in:
- `src/app/tab1/` - Dashboard implementation
- `src/app/tab2/` - Data display implementation
- `src/app/tab3/` - Analysis implementation
- `src/app/services/sensor-data.service.ts` - Service implementation
- `src/app/models/sensor-data.model.ts` - Data models
