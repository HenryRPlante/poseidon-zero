# Sensor Data Visualization & 5-Minute Polling Update

## Summary of Changes

Your Poseidon Zero app has been updated with:

### ✅ 1. **5-Minute Polling Interval**
- Changed from 5-second polling to **300,000ms (5 minutes)** intervals
- Conserves battery on remote Arduino devices with cellular modems
- Updated in `SensorDataService` configuration

### ✅ 2. **Advanced Data Visualization**
- Integrated **Chart.js** for professional data graphing
- Created reusable `SensorChartComponent` for chart display
- Displays 5 different chart types with mock data support

### ✅ 3. **Chart Types Available**

#### Temperature Trend Chart
- Displays water temperature history over time
- Red line graph with smooth curves
- Real-time updates as new data arrives

#### TDS (Total Dissolved Solids) Chart
- Tracks ppm measurements
- Teal-colored visualization
- Shows water quality changes

#### Electrical Conductivity (EC) Chart
- Yellow line chart
- Displays conductivity trends in mS/cm
- Useful for detecting water composition changes

#### pH Level Chart  
- Green-blue visualization
- Shows pH stability and variations
- Range: 0-14 with optimal zone highlighting

#### Multi-Sensor Normalized Comparison
- Combines all 4 sensors on one graph
- Values normalized to 0-100% scale
- Easy comparison of sensor performance

#### Sensor Status Radar Chart
- 6-point radar showing device health
- Includes signal strength and battery level
- Found in Analysis tab (Tab 3)

### 📊 **Chart Locations**

| Tab | Charts Included |
|-----|-----------------|
| **Tab 1: Dashboard** | Device status, location map |
| **Tab 2: Data** | All 5 line charts, readings history, trial export |
| **Tab 3: Analysis** | Radar chart, statistics, regression analysis |

### 🔄 **Data Flow**

```
Arduino Device
    ↓ (HTTP GET /api/sensors)
Cellular Modem
    ↓ (every 5 minutes)
Mobile App
    ↓
SensorDataService
    ├→ Store in localStorage
    ├→ Add to readings history
    └→ Update BehaviorSubjects
         ↓
    Charts & Components (update automatically)
```

### 📱 **Live Demo with Mock Data**

When real data is not available, the charts display realistic mock data:
- Temperature: 20-28°C range
- TDS: 400-500 ppm range
- EC: 0.7-1.1 mS/cm range
- pH: 6.8-7.4 range

This allows you to see chart functionality immediately.

### 🔧 **Configuration**

#### Change Polling Interval
In `src/app/services/sensor-data.service.ts`:
```typescript
private pollingInterval = 300000; // Change this value in milliseconds
```

Common intervals:
- `30000` = 30 seconds (development)
- `60000` = 1 minute
- `300000` = 5 minutes (default - battery efficient)
- `1800000` = 30 minutes (ultra low power)

#### Control Chart Display
Pass different chart types to `SensorChartComponent`:
```html
<app-sensor-chart 
  [readings]="readingsHistory"
  [chartType]="'temperature'">  <!-- Options: temperature, tds, ec, ph, multi, radar -->
</app-sensor-chart>
```

### 📚 **New Files Created**

```
src/app/
├── services/
│   └── chart.service.ts          ← Chart configuration service
├── components/
│   └── sensor-chart/
│       ├── sensor-chart.component.ts      ← Reusable chart component
│       ├── sensor-chart.component.html    ← Chart template
│       ├── sensor-chart.component.scss    ← Chart styling
│       └── sensor-chart.module.ts         ← Chart module (for reference)
```

### 📦 **New Dependencies**

- `chart.js@^4.4.0` - Core charting library
- `ng2-charts@^4.1.1` - Angular wrapper for Chart.js

### ⚙️ **How Charts Update**

1. **Real-time Updates**: Once your Arduino sends data, charts populate automatically
2. **Historical View**: Select a trial to see all recorded data on charts
3. **Mock Data**: Charts show sample data when no real readings exist
4. **localStorage**: All data persists across app sessions

### 🚀 **Using the Charts**

1. **Tab 2 (Data tab):**
   - Scroll down to see all 5 sensor trend charts
   - Charts update automatically as new readings arrive
   - Select trial from segment buttons to view historical data
   - Export data as CSV below the charts

2. **Tab 3 (Analysis tab):**
   - Radar chart shows overall sensor status
   - Statistical summaries (min/max/avg) update automatically
   - Choose a trial to analyze specific data
   - Export detailed analysis reports

### 📊 **Example Arduino Response Still Required**

Your Arduino endpoint must respond to:
```
GET http://192.168.1.100:8080/api/sensors
```

With JSON:
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-02-13T14:00:00Z",
    "tds": 450.5,
    "temperature": 22.4,
    "ec": 0.8,
    "ph": 7.2,
    "signalStrength": -72,
    "batteryLevel": 87
  },
  "timestamp": "2026-02-13T14:00:00Z"
}
```

### 🔍 **Testing the Charts**

1. Run the app: `npm start`
2. Open Tab 2 (Data) - see mock charts at bottom
3. Open Tab 3 (Analysis) - see radar chart
4. Once Arduino connects, real data replaces mock data automatically
5. Charts update every 5 minutes

### ⏱️ **Polling Details**

- **Interval**: 5 minutes (300,000ms)
- **Device**: Checks each configured Arduino device
- **On Failure**: Marks device as "offline"
- **On Success**: Updates battery, signal, and sensor readings
- **Local Storage**: Keeps up to 100 readings in memory

### 💡 **Tips**

- Polling every 5 minutes is ideal for battery life on remote devices
- Charts automatically generate smooth curves with interpolation
- Use Tab 2 for continuous monitoring
- Use Tab 3 for detailed analysis and reporting
- Export trial data for external analysis

### 🐛 **Troubleshooting**

**Charts show "Loading chart data..."**
- Ensure readings have been received or wait for mock data to load
- Check browser console (F12) for errors

**Charts not updating**
- Verify Arduino is connected
- Check network connectivity
- Ensure data format matches expected JSON structure

**Performance issues with many data points**
- The service keeps max 100 readings in history
- Older readings are automatically removed when limit reached
- Export old trials to free up memory

---

**Ready to go!** Your app now displays beautiful sensor data visualizations with efficient 5-minute polling.
