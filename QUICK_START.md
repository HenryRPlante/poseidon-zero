# Quick Start - Arduino Sensor Integration

## Step 1: Configure Your Devices (5 minutes)

Add this to `src/app/app.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { SensorDataService } from './services/sensor-data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  
  constructor(private sensorDataService: SensorDataService) {}
  
  ngOnInit() {
    this.setupSensors();
  }
  
  setupSensors() {
    // Replace with your actual Arduino device IP addresses
    this.sensorDataService.initializeDevices([
      {
        id: 'device-1',
        name: 'Main Buoy',
        ipAddress: '192.168.1.100', // ← Change this
        port: 8080,
        location: {
          latitude: 41.40338,
          longitude: 2.17403,
          name: 'Your Location'
        },
        lastSync: new Date(),
        status: 'offline'
      }
    ]);
    
    // Start receiving data every 5 seconds
    this.sensorDataService.startPolling('device-1', 5000).subscribe({
      next: (reading) => console.log('New data:', reading),
      error: (error) => console.error('Connection error:', error)
    });
  }
}
```

## Step 2: Verify Arduino Response

Your Arduino HTTP endpoint should respond to:
```
GET http://192.168.1.100:8080/api/sensors
```

With this JSON:
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-02-13T14:20:00Z",
    "tds": 450.5,
    "temperature": 22.4,
    "ec": 0.8,
    "ph": 7.2,
    "signalStrength": -72,
    "batteryLevel": 87
  },
  "timestamp": "2026-02-13T14:20:00Z"
}
```

## Step 3: Run the App

```bash
npm start
```

Open `http://localhost:4200` and view:
- **Tab 1** - Live sensor readings
- **Tab 2** - Historical data
- **Tab 3** - Analysis & statistics

## What's Included

| File | Purpose |
|------|---------|
| `src/app/services/sensor-data.service.ts` | Core service |
| `src/app/models/sensor-data.model.ts` | Data models |
| `src/app/tab1/` | Dashboard |
| `src/app/tab2/` | Data view |
| `src/app/tab3/` | Analysis |
| `src/app/examples/sensor-initialization.example.ts` | Usage examples |
| `ARDUINO_INTEGRATION_GUIDE.md` | Full Arduino guide |
| `SENSOR_SETUP.md` | Complete documentation |

## Supported Sensors

- ✅ **TDS Sensor** - Measures dissolved solids (ppm)
- ✅ **Temperature** - Water temperature (°C)
- ✅ **EC Sensor** - Electrical conductivity (mS/cm)
- ✅ **pH Meter** - Water pH (0-14)

## Common Issues

| Issue | Solution |
|-------|----------|
| "Device Offline" | Check Arduino IP address & network |
| No data appears | Verify Arduino returns correct JSON format |
| Slow updates | Increase polling interval (e.g., 10000ms) |
| High memory usage | Reduce `maxHistoricalReadings` in service |

## API Quick Reference

```typescript
// Get latest reading
const reading = this.sensorDataService.getCurrentReading();
console.log(reading.temperature); // °C
console.log(reading.tds);         // ppm
console.log(reading.ph);          // pH

// Subscribe to new readings
this.sensorDataService.currentReading$.subscribe(reading => {
  // Handle new data
});

// Save trial data
this.sensorDataService.saveTrialData({
  trialId: 'test-1',
  trialName: 'Field Test',
  readings: this.sensorDataService.getReadingsHistory(),
  startTime: new Date(),
  endTime: new Date(),
  location: 'Harbor'
});

// Export as CSV (used in Tab 2)
const trials = this.sensorDataService.getTrialData();
```

## Next Steps

1. ✅ Update Arduino IP address in app component
2. ✅ Ensure Arduino responds with correct JSON
3. ✅ Run `npm start`
4. ✅ Check browser console for errors
5. ✅ View sensor data in dashboard

## Documentation

- **Full setup guide**: See `ARDUINO_INTEGRATION_GUIDE.md`
- **Complete reference**: See `SENSOR_SETUP.md`
- **Code examples**: See `src/app/examples/sensor-initialization.example.ts`

## Support

Check the browser console (F12) for detailed error messages and debug output.

---

**Ready to go!** Just update the IP address and you're all set.
