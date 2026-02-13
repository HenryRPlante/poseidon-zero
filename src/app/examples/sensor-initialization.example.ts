import { Component, OnInit } from '@angular/core';
import { SensorDataService } from './services/sensor-data.service';
import { SensorDevice } from './models/sensor-data.model';

/**
 * Example App Component Configuration for Arduino Sensor Integration
 * 
 * This file demonstrates how to initialize the sensor data service
 * with your Arduino devices sending data via cellular modem.
 * 
 * To use this example:
 * 1. Update the device IP addresses to match your Arduino devices
 * 2. Configure the correct ports (default: 8080)
 * 3. Update location coordinates for your deployment areas
 * 4. Add this code to your app.component.ts
 */

export class SensorInitializationExample {

  constructor(private sensorDataService: SensorDataService) {}

  /**
   * Example 1: Single Device Configuration
   * Use this if you have one Arduino device with multiple sensors
   */
  initializeSingleDevice() {
    const device: SensorDevice = {
      id: 'arduino-buoy-01',
      name: 'Main Buoy',
      ipAddress: '192.168.1.100',  // Arduino device IP (via cellular modem)
      port: 8080,                   // HTTP server port on Arduino
      location: {
        latitude: 41.40338,
        longitude: 2.17403,
        name: 'Barcelona Harbor - Main Station'
      },
      lastSync: new Date(),
      status: 'offline'
    };

    this.sensorDataService.initializeDevices([device]);
    
    // Start polling for data
    this.sensorDataService.startPolling('arduino-buoy-01', 5000).subscribe({
      next: (reading) => {
        console.log('Temperature:', reading.temperature + '°C');
        console.log('TDS:', reading.tds + ' ppm');
        console.log('EC:', reading.ec + ' mS/cm');
        console.log('pH:', reading.ph);
      },
      error: (error) => {
        console.error('Failed to fetch sensor data:', error);
      }
    });
  }

  /**
   * Example 2: Multiple Devices Configuration
   * Use this if you have multiple Arduino devices at different locations
   */
  initializeMultipleDevices() {
    const devices: SensorDevice[] = [
      {
        id: 'arduino-buoy-01',
        name: 'Buoy 1 - Harbor Entrance',
        ipAddress: '192.168.1.100',
        port: 8080,
        location: {
          latitude: 41.40338,
          longitude: 2.17403,
          name: 'Barcelona Harbor - Entrance'
        },
        lastSync: new Date(),
        status: 'offline'
      },
      {
        id: 'arduino-buoy-02',
        name: 'Buoy 2 - Center Channel',
        ipAddress: '192.168.1.101',
        port: 8080,
        location: {
          latitude: 41.38783,
          longitude: 2.16999,
          name: 'Barcelona Harbor - Center'
        },
        lastSync: new Date(),
        status: 'offline'
      },
      {
        id: 'arduino-buoy-03',
        name: 'Buoy 3 - Deep Water',
        ipAddress: '192.168.1.102',
        port: 8080,
        location: {
          latitude: 41.37500,
          longitude: 2.15000,
          name: 'Barcelona Harbor - Deep Water'
        },
        lastSync: new Date(),
        status: 'offline'
      }
    ];

    this.sensorDataService.initializeDevices(devices);
    
    // Start polling from all devices
    devices.forEach(device => {
      this.sensorDataService.startPolling(device.id, 5000).subscribe({
        next: (reading) => {
          console.log(`[${device.name}] Updated at:`, new Date(reading.timestamp));
        },
        error: (error) => {
          console.error(`[${device.name}] Polling error:`, error);
        }
      });
    });
  }

  /**
   * Example 3: Dynamic Device Addition
   * Use this to add devices at runtime (e.g., from a configuration API)
   */
  addDeviceDynamically(name: string, ipAddress: string, latitude: number, longitude: number) {
    const newDevice: SensorDevice = {
      id: 'arduino-' + Date.now(),
      name: name,
      ipAddress: ipAddress,
      port: 8080,
      location: {
        latitude: latitude,
        longitude: longitude,
        name: name
      },
      lastSync: new Date(),
      status: 'offline'
    };

    this.sensorDataService.addDevice(newDevice);
    
    // Start polling immediately
    this.sensorDataService.startPolling(newDevice.id, 5000).subscribe({
      next: (reading) => {
        console.log(`New device [${name}] reading received:`, reading);
      },
      error: (error) => {
        console.error(`New device [${name}] error:`, error);
      }
    });
  }

  /**
   * Example 4: Configure Custom Polling Interval
   * Use this if you want different polling rates
   */
  configurePollingIntervals() {
    // Fast polling for critical data (2 seconds)
    this.sensorDataService.setPollingInterval(2000);
    this.sensorDataService.startPolling('arduino-buoy-01', 2000);

    // Normal polling for standard monitoring (5 seconds)
    this.sensorDataService.setPollingInterval(5000);
    this.sensorDataService.startPolling('arduino-buoy-02', 5000);

    // Slow polling for background monitoring (30 seconds)
    this.sensorDataService.startPolling('arduino-buoy-03', 30000);
  }

  /**
   * Example 5: Store and Retrieve Trial Data
   * Use this for saving data collection sessions
   */
  recordTrialData() {
    // After collecting data, save it as a trial
    const historyData = this.sensorDataService.getReadingsHistory();
    
    this.sensorDataService.saveTrialData({
      trialId: 'field-test-' + Date.now(),
      trialName: 'Field Test - February 13, 2026',
      readings: historyData,
      startTime: new Date(historyData[0]?.timestamp || Date.now()),
      endTime: new Date(),
      location: 'Barcelona Harbor'
    });

    console.log('Trial data saved successfully');
  }

  /**
   * Example 6: Error Handling and Status Monitoring
   * Use this to implement robust error handling
   */
  setupErrorHandling() {
    const devices = this.sensorDataService['devicesSubject'].value;
    
    devices.forEach(device => {
      this.sensorDataService.startPolling(device.id, 5000).subscribe({
        next: (reading) => {
          console.log(`✓ Device ${device.name}: Data received at ${reading.timestamp}`);
        },
        error: (error) => {
          console.error(`✗ Device ${device.name}: Connection failed - ${error.message}`);
          // Could trigger notification/alert here
        },
        complete: () => {
          console.log(`Device ${device.name}: Polling completed`);
        }
      });
    });
  }

  /**
   * Example 7: Real-time Data Monitoring with Thresholds
   * Use this to trigger alerts when values exceed thresholds
   */
  monitorWithThresholds() {
    this.sensorDataService.currentReading$.subscribe(reading => {
      if (!reading) return;

      // pH threshold check (optimal pH for most water is 6.5-7.5)
      if (reading.ph < 6.5 || reading.ph > 7.5) {
        console.warn(`⚠ Alert: pH level ${reading.ph} is outside optimal range`);
      }

      // TDS threshold check (safe TDS is typically below 500 ppm)
      if (reading.tds > 500) {
        console.warn(`⚠ Alert: TDS level ${reading.tds} ppm exceeds safe threshold`);
      }

      // Temperature threshold (example: alert if above 30°C or below 10°C)
      if (reading.temperature > 30 || reading.temperature < 10) {
        console.warn(`⚠ Alert: Temperature ${reading.temperature}°C is out of range`);
      }

      // EC threshold check (normal range typically 0.5-2.0 mS/cm for freshwater)
      if (reading.ec > 2.0) {
        console.warn(`⚠ Alert: EC level ${reading.ec} mS/cm is elevated`);
      }
    });
  }

  /**
   * Example 8: Export Data in Different Formats
   * The service automatically supports CSV, but you can add more formats
   */
  exportMultipleFormats() {
    const trials = this.sensorDataService.getTrialData();
    
    trials.forEach(trial => {
      // CSV format (already implemented in Tab2Page)
      const csvContent = this.generateCSV(trial);
      this.downloadFile(csvContent, `${trial.trialName}.csv`, 'text/csv');

      // JSON format
      const jsonContent = JSON.stringify(trial, null, 2);
      this.downloadFile(jsonContent, `${trial.trialName}.json`, 'application/json');

      // XML format (if needed)
      const xmlContent = this.generateXML(trial);
      this.downloadFile(xmlContent, `${trial.trialName}.xml`, 'application/xml');
    });
  }

  private generateCSV(trial: any): string {
    let csv = 'Timestamp,TDS (ppm),Temperature (°C),EC (mS/cm),pH,Signal,Battery\n';
    trial.readings.forEach((reading: any) => {
      csv += `${reading.timestamp},${reading.tds},${reading.temperature},${reading.ec},${reading.ph},${reading.signalStrength},${reading.batteryLevel}\n`;
    });
    return csv;
  }

  private generateXML(trial: any): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<trial>\n';
    xml += `  <name>${trial.trialName}</name>\n`;
    xml += `  <location>${trial.location}</location>\n`;
    xml += '  <readings>\n';
    trial.readings.forEach((reading: any) => {
      xml += '    <reading>\n';
      xml += `      <timestamp>${reading.timestamp}</timestamp>\n`;
      xml += `      <tds>${reading.tds}</tds>\n`;
      xml += `      <temperature>${reading.temperature}</temperature>\n`;
      xml += `      <ec>${reading.ec}</ec>\n`;
      xml += `      <ph>${reading.ph}</ph>\n`;
      xml += '    </reading>\n';
    });
    xml += '  </readings>\n</trial>';
    return xml;
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Example 9: Integration with AppComponent
   * Add this to your app.component.ts ngOnInit()
   */
  exampleAppComponentIntegration() {
    // Option A: Initialize single device
    // this.initializeSingleDevice();

    // Option B: Initialize multiple devices
    // this.initializeMultipleDevices();

    // Option C: Configure custom polling
    // this.configurePollingIntervals();

    // Option D: Setup error handling
    // this.setupErrorHandling();

    // Option E: Monitor with thresholds
    // this.monitorWithThresholds();
  }
}

/**
 * USAGE IN APP.COMPONENT.TS:
 * 
 * import { Component, OnInit } from '@angular/core';
 * import { SensorDataService } from './services/sensor-data.service';
 * 
 * @Component({
 *   selector: 'app-root',
 *   templateUrl: './app.component.html',
 *   styleUrls: ['./app.component.scss']
 * })
 * export class AppComponent implements OnInit {
 * 
 *   constructor(private sensorDataService: SensorDataService) {}
 * 
 *   ngOnInit() {
 *     this.initializeArduinoDevices();
 *   }
 * 
 *   initializeArduinoDevices() {
 *     const devices = [
 *       {
 *         id: 'arduino-buoy-01',
 *         name: 'Main Buoy',
 *         ipAddress: '192.168.1.100',
 *         port: 8080,
 *         location: {
 *           latitude: 41.40338,
 *           longitude: 2.17403,
 *           name: 'Barcelona Harbor'
 *         },
 *         lastSync: new Date(),
 *         status: 'offline' as const
 *       }
 *     ];
 * 
 *     this.sensorDataService.initializeDevices(devices);
 *     
 *     // Start polling immediately
 *     devices.forEach(device => {
 *       this.sensorDataService.startPolling(device.id, 5000).subscribe({
 *         next: (reading) => console.log('New reading:', reading),
 *         error: (error) => console.error('Polling error:', error)
 *       });
 *     });
 *   }
 * }
 */
