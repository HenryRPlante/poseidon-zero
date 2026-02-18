# Fake Sensor Data - TEMPORARY

This folder contains mock/fake sensor data for testing and demonstration purposes.

## Files
- `fake-buoy.service.ts` - Service that generates and manages fake buoy sensor readings

## Purpose
These files simulate a real buoy sensor device with realistic water quality measurements:
- Temperature (20-24°C)
- TDS/Total Dissolved Solids (500-700 ppm)
- EC/Electrical Conductivity (1.0-1.4 mS/cm)
- pH (6.9-7.5)
- Signal Strength (-95 to -55 dBm)
- Battery Level (85-95%)

Data updates every 5 minutes automatically.

## When to Delete
**Delete this entire folder when:**
1. Real Arduino/sensor hardware is integrated
2. Real sensor data service is fully implemented
3. Live water quality data from actual buoys is being used

## Current Usage
- Tab 3 (Analysis page) uses `FakeBuoyService` for chart demonstrations
- Replace the service injection in `tab3.page.ts` when switching to real data

## Replacement Steps
1. Remove the import of `FakeBuoyService` from `tab3.page.ts`
2. Remove the `fakeBuoyService` dependency injection
3. Update the subscription to use `sensorDataService.readingsHistory$` instead
4. Delete `/src/app/fake-sensor-data/` folder
