# Water Quality Sensor Integration - Poseidon Zero

## Overview

Your Ionic Angular app has been configured to receive real-time water quality sensor data from Arduino devices communicating via cellular modem. The app now supports:

- **Real-time data collection** from multiple Arduino devices
- **Live dashboard** displaying sensor readings and device status
- **Data logging** with historical trial support
- **Advanced analysis** with statistics and regression analysis
- **Data export** in multiple formats (CSV, JSON, XML)

## What's New

### New Components & Services

#### 1. **Sensor Data Service** (`src/app/services/sensor-data.service.ts`)
Central service for managing all sensor data communication and storage:
- HTTP polling of Arduino devices
- Local storage persistence
- Real-time subscription streams (RxJS observables)
- Device management and status tracking
- Trial data storage

#### 2. **Sensor Data Models** (`src/app/models/sensor-data.model.ts`)
TypeScript interfaces for type safety:
- `SensorReading` - Individual sensor measurement
- `SensorDevice` - Arduino device configuration
- `SensorDataResponse` - HTTP response format
- `HistoricalData` - Trial data collection

#### 3. **Updated Tab Components**

**Tab 1 - Dashboard** (`tab1/`)
- Live device status with online/offline indicator
- Current sensor readings display
- Device selection dropdown
- Location map display
- Battery and signal strength indicators
- Real-time data refresh button

**Tab 2 - Data** (`tab2/`)
- Live sensor data view
- Segment control to switch between live and trial data
- Recent readings history
- Trial data summary
- CSV export functionality

**Tab 3 - Analysis** (`tab3/`)
- Statistical analysis (min/max/average)
- Linear regression analysis
- Temperature, TDS, EC, and pH analysis
- Trial selection and comparison
- Analysis report export

### Supported Sensors

1. **TDS Sensor** (Total Dissolved Solids)
   - Measures: 0-1000+ ppm
   - Units: ppm (parts per million)

2. **Temperature Sensor** (DS18B20)
   - Measures: Aqueous environment temperature
   - Units: °C (Celsius)

3. **EC Sensor** (Electrical Conductivity)
   - Measures: Water's ability to conduct electricity
   - Units: mS/cm (milliSiemens per centimeter)

4. **pH Meter**
   - Measures: Acidity/Alkalinity
   - Range: 0-14
   - Units: pH

## Getting Started

### 1. Configure Your Arduino Device

Your Arduino device should expose two HTTP endpoints:

**GET /api/sensors**
Returns current sensor readings:
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-02-13T14:20:00.000Z",
    "tds": 450.5,
    "temperature": 22.4,
    "ec": 0.8,
    "ph": 7.2,
    "signalStrength": -72,
    "batteryLevel": 87
  },
  "timestamp": "2026-02-13T14:20:00.000Z"
}
```

**GET /api/info** (Optional)
Returns device information.

### 2. Initialize Devices in Your App

Edit `src/app/app.component.ts` and add this to `ngOnInit()`:

```typescript
import { SensorDataService } from './services/sensor-data.service';

export class AppComponent implements OnInit {
  constructor(private sensorDataService: SensorDataService) {}

  ngOnInit() {
    this.initializeSensors();
  }

  initializeSensors() {
    const devices = [
      {
        id: 'buoy-01',
        name: 'Main Buoy',
        ipAddress: '192.168.1.100',  // Your Arduino's IP
        port: 8080,                   // Your Arduino's HTTP port
        location: {
          latitude: 41.40338,
          longitude: 2.17403,
          name: 'Harbor Station'
        },
        lastSync: new Date(),
        status: 'offline' as const
      }
    ];

    this.sensorDataService.initializeDevices(devices);
    
    // Start polling data every 5 seconds
    devices.forEach(device => {
      this.sensorDataService.startPolling(device.id, 5000).subscribe({
        next: (reading) => {
          console.log('New reading:', reading);
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });
    });
  }
}
```

### 3. View the Data

Navigate through the three tabs:
- **Dashboard**: Real-time status and readings
- **Data**: Historical data and trials
- **Analysis**: Statistical insights

## API Reference

### SensorDataService Methods

```typescript
// Initialize devices
initializeDevices(devices: SensorDevice[]): void

// Add single device at runtime
addDevice(device: SensorDevice): void

// Start polling a device
startPolling(deviceId: string, interval?: number): Observable<SensorReading>

// Fetch single reading immediately
fetchSensorData(deviceId: string): Observable<SensorReading>

// Fetch from all devices
fetchAllSensorData(): Observable<Map<string, SensorReading>>

// Get current reading
getCurrentReading(): SensorReading | null

// Get readings history
getReadingsHistory(): SensorReading[]

// Save trial data
saveTrialData(trialData: HistoricalData): void

// Get all trials
getTrialData(): HistoricalData[]

// Get specific trial
getTrialById(trialId: string): HistoricalData | undefined

// Set polling interval (milliseconds)
setPollingInterval(interval: number): void
```

### Observable Streams

Subscribe to real-time updates:

```typescript
// Current sensor reading
this.sensorDataService.currentReading$.subscribe(reading => {
  console.log('Latest reading:', reading);
});

// Devices
this.sensorDataService.devices$.subscribe(devices => {
  console.log('Devices:', devices);
});

// Readings history
this.sensorDataService.readingsHistory$.subscribe(history => {
  console.log('History:', history);
});

// Trial data
this.sensorDataService.historicalData$.subscribe(trials => {
  console.log('Trials:', trials);
});
```

## Data Persistence

All data is automatically saved to browser's `localStorage`:
- `sensorDevices` - Device configurations
- `sensorReadingsHistory` - Recent readings (max 100)
- `sensorTrialsData` - Trial data

Data survives page refreshes and browser sessions.

## File Structure

```
src/app/
├── services/
│   └── sensor-data.service.ts         # Main service
├── models/
│   └── sensor-data.model.ts           # TypeScript interfaces
├── tab1/                              # Dashboard
│   ├── tab1.page.ts
│   ├── tab1.page.html
│   ├── tab1.page.scss
│   └── tab1.module.ts
├── tab2/                              # Data
│   ├── tab2.page.ts
│   ├── tab2.page.html
│   ├── tab2.page.scss
│   └── tab2.module.ts
├── tab3/                              # Analysis
│   ├── tab3.page.ts
│   ├── tab3.page.html
│   ├── tab3.page.scss
│   └── tab3.module.ts
└── examples/
    └── sensor-initialization.example.ts  # Usage examples
```

## Examples

See `src/app/examples/sensor-initialization.example.ts` for comprehensive examples including:
- Single device setup
- Multiple devices setup
- Dynamic device addition
- Custom polling intervals
- Error handling
- Real-time thresholding
- Multiple export formats

## Troubleshooting

### "Device Status: Offline"
- Verify Arduino device is powered and connected
- Check IP address and port are correct
- Ensure Arduino HTTP server is running
- Check network connectivity

### "No Data Displayed"
- Verify Arduino returns JSON in expected format
- Check browser console for HTTP errors
- Confirm SensorDevice configuration matches actual device
- Test with browser's Network tab to see actual response

### "High Latency"
- Increase polling interval (faster polling = more network traffic)
- Check cellular signal strength
- Consider using WebSockets for real-time updates
- Reduce payload size on Arduino device

## Performance Optimization

For better performance:

1. **Adjust polling interval** based on your needs:
   ```typescript
   // Fast updates (2 sec) for monitoring
   this.sensorDataService.startPolling(deviceId, 2000);
   
   // Standard updates (5 sec)
   this.sensorDataService.startPolling(deviceId, 5000);
   
   // Slow updates (30 sec) for background
   this.sensorDataService.startPolling(deviceId, 30000);
   ```

2. **Limit history size** - Currently stores 100 most recent readings
   - Modify `maxHistoricalReadings` in sensor-data.service.ts

3. **Clear data periodically**:
   ```typescript
   this.sensorDataService.clearReadingsHistory();
   ```

## Arduino Implementation Guide

See `ARDUINO_INTEGRATION_GUIDE.md` for detailed instructions on:
- Hardware setup
- Arduino code structure
- JSON response format
- Sensor wiring diagrams
- Example Arduino sketch

## Browser Support

- Chrome/Chromium
- Firefox
- Safari
- Edge

## Security Considerations

For production deployments:

1. Use HTTPS instead of HTTP
2. Implement authentication/authorization
3. Add CORS headers on Arduino device
4. Encrypt sensitive data
5. Validate all incoming data
6. Rate limit API requests

## Future Enhancements

Potential improvements:
- WebSocket support for real-time updates
- Cloud data backup/sync
- Mobile push notifications
- Advanced charting/graphing
- Anomaly detection
- Predictive analytics
- Multi-language support
- Dark mode

## Support

For issues or questions:
1. Check browser console for errors
2. Review `ARDUINO_INTEGRATION_GUIDE.md`
3. Refer to example code in `sensor-initialization.example.ts`
4. Check sensor readings are in valid ranges
5. Verify network connectivity

---

**Version:** 1.0.0  
**Last Updated:** February 13, 2026  
**Compatible With:** Angular 20, Ionic 8, TypeScript 5
