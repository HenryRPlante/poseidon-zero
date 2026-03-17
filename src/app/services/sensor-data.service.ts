import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { SensorReading, SensorDevice, SensorDataResponse, HistoricalData } from '../models/sensor-data.model';

@Injectable({
  providedIn: 'root'
})
export class SensorDataService {

  private currentReadingSubject = new BehaviorSubject<SensorReading | null>(null);
  public currentReading$ = this.currentReadingSubject.asObservable();

  private devicesSubject = new BehaviorSubject<SensorDevice[]>([]);
  public devices$ = this.devicesSubject.asObservable();

  private historicalDataSubject = new BehaviorSubject<HistoricalData[]>([]);
  public historicalData$ = this.historicalDataSubject.asObservable();

  private readingsHistorySubject = new BehaviorSubject<SensorReading[]>([]);
  public readingsHistory$ = this.readingsHistorySubject.asObservable();

  // Configuration
  private pollingInterval = 300000; // Poll every 5 minutes
  private maxHistoricalReadings = 100;
  
  // Global polling control
  private globalPollingActive = false;
  private globalPollingSubscription: any = null;

  constructor(private http: HttpClient) {
    this.initializeStorageFromLocalStorage();
  }

  /**
   * Initialize sensor device configuration
   * This would typically come from a backend API or configuration file
   */
  public initializeDevices(devices: SensorDevice[]): void {
    this.devicesSubject.next(devices);
    this.saveDevicesToLocalStorage(devices);
    
    // Start global polling automatically for the first device
    if (devices.length > 0 && !this.globalPollingActive) {
      this.startGlobalPolling(devices[0].id);
    }
  }

  /**
   * Start global polling that runs regardless of which tab is active
   * This ensures data is available immediately when tabs 2 and 3 are visited
   */
  private startGlobalPolling(deviceId: string): void {
    if (this.globalPollingActive) return;
    this.globalPollingActive = true;

    // Poll every 2 seconds
    this.globalPollingSubscription = interval(2000)
      .pipe(
        switchMap(() => this.fetchSensorData(deviceId)),
        catchError(error => {
          console.error('Error in global polling:', error);
          return of();
        })
      )
      .subscribe((reading: SensorReading) => {
        if (reading) {
          this.currentReadingSubject.next(reading);
          this.addToReadingsHistory(reading);
        }
      });
  }

  /**
   * Stop global polling (for cleanup)
   */
  public stopGlobalPolling(): void {
    if (this.globalPollingSubscription) {
      this.globalPollingSubscription.unsubscribe();
      this.globalPollingSubscription = null;
      this.globalPollingActive = false;
    }
  }

  /**
   * Add a new sensor device
   */
  public addDevice(device: SensorDevice): void {
    const devices = this.devicesSubject.value;
    devices.push(device);
    this.devicesSubject.next(devices);
    this.saveDevicesToLocalStorage(devices);
  }

  /**
   * Start polling sensor data from Arduino device
   * Fetches data at regular intervals via HTTP (cellular modem connection)
   */
  public startPolling(deviceId: string, pollingInterval: number = this.pollingInterval): Observable<SensorReading> {
    return interval(pollingInterval).pipe(
      switchMap(() => this.fetchSensorData(deviceId)),
      tap((reading: SensorReading) => {
        this.currentReadingSubject.next(reading);
        this.addToReadingsHistory(reading);
      }),
      catchError(error => {
        console.error('Error fetching sensor data:', error);
        return of();
      })
    );
  }

  /**
   * Fetch sensor data from a specific Arduino device
   * Communicates via HTTP to the device's IP address (through cellular modem)
   */
  public fetchSensorData(deviceId: string): Observable<SensorReading> {
    const device = this.devicesSubject.value.find(d => d.id === deviceId);
    
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    // Use /api/sensors/last endpoint for Flask compatibility
    // Support both localhost HTTP and Codespaces HTTPS URLs
    const protocol = device.ipAddress.includes('github.dev') ? 'https' : 'http';
    const url = `${protocol}://${device.ipAddress}${!device.ipAddress.includes(':') && device.port ? `:${device.port}` : ''}/api/sensors/last`;
    
    return this.http.get<SensorDataResponse>(url).pipe(
      tap((response: SensorDataResponse) => {
        if (response.success && response.data) {
          // Update device last sync time
          this.updateDeviceLastSync(deviceId);
          this.updateDeviceStatus(deviceId, 'online');
        }
      }),
      switchMap((response: SensorDataResponse) => {
        if (response.success && response.data) {
          return of(response.data);
        } else {
          this.updateDeviceStatus(deviceId, 'error');
          throw new Error(response.error || 'Failed to fetch sensor data');
        }
      }),
      catchError(error => {
        this.updateDeviceStatus(deviceId, 'offline');
        throw error;
      })
    );
  }

  /**
   * Fetch sensor data from all registered devices
   */
  public fetchAllSensorData(): Observable<Map<string, SensorReading>> {
    const devices = this.devicesSubject.value;
    
    return new Observable(observer => {
      const results = new Map<string, SensorReading>();
      let completed = 0;

      devices.forEach(device => {
        this.fetchSensorData(device.id).subscribe(
          reading => {
            results.set(device.id, reading);
            completed++;
            if (completed === devices.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error => {
            console.error(`Error fetching data from device ${device.id}:`, error);
            completed++;
            if (completed === devices.length) {
              observer.next(results);
              observer.complete();
            }
          }
        );
      });

      if (devices.length === 0) {
        observer.next(new Map());
        observer.complete();
      }
    });
  }

  /**
   * Get the current sensor reading
   */
  public getCurrentReading(): SensorReading | null {
    return this.currentReadingSubject.value;
  }

  /**
   * Get readings history
   */
  public getReadingsHistory(): SensorReading[] {
    return this.readingsHistorySubject.value;
  }

  /**
   * Manual refresh hook (disabled for mock data)
   */
  public refreshReadings(): void {
    return;
  }

  /**
   * Add reading to history (maintains a maximum size)
   */
  private addToReadingsHistory(reading: SensorReading): void {
    const history = this.readingsHistorySubject.value;
    history.push(reading);

    // Keep only the most recent readings
    if (history.length > this.maxHistoricalReadings) {
      history.shift();
    }

    this.readingsHistorySubject.next([...history]);
    this.saveReadingsToLocalStorage(history);
  }

  /**
   * Store historical trial data
   */
  public saveTrialData(trialData: HistoricalData): void {
    const trials = this.historicalDataSubject.value;
    trials.push(trialData);
    this.historicalDataSubject.next(trials);
    this.saveTrialsToLocalStorage(trials);
  }

  /**
   * Get historical trial data
   */
  public getTrialData(): HistoricalData[] {
    return this.historicalDataSubject.value;
  }

  /**
   * Get a specific trial by ID
   */
  public getTrialById(trialId: string): HistoricalData | undefined {
    return this.historicalDataSubject.value.find(t => t.trialId === trialId);
  }

  /**
   * Clear readings history
   */
  public clearReadingsHistory(): void {
    this.readingsHistorySubject.next([]);
    localStorage.removeItem('sensorReadingsHistory');
  }

  /**
   * Add imported readings to history (for bulk import from files)
   */
  public addImportedReadings(readings: SensorReading[]): void {
    const history = this.readingsHistorySubject.value;
    
    // Add all imported readings
    history.push(...readings);

    // Sort by timestamp to maintain chronological order
    history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Keep only the most recent readings if we exceed the limit
    while (history.length > this.maxHistoricalReadings) {
      history.shift();
    }

    this.readingsHistorySubject.next([...history]);
    this.saveReadingsToLocalStorage(history);

    // Update current reading to the latest one
    if (readings.length > 0) {
      const latestReading = readings[readings.length - 1];
      this.currentReadingSubject.next(latestReading);
    }
  }

  /**
   * Update device last sync timestamp
   */
  private updateDeviceLastSync(deviceId: string): void {
    const devices = this.devicesSubject.value;
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      device.lastSync = new Date();
      this.devicesSubject.next([...devices]);
      this.saveDevicesToLocalStorage(devices);
    }
  }

  /**
   * Update device status
   */
  private updateDeviceStatus(deviceId: string, status: 'online' | 'offline' | 'error'): void {
    const devices = this.devicesSubject.value;
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      device.status = status;
      this.devicesSubject.next([...devices]);
      this.saveDevicesToLocalStorage(devices);
    }
  }

  /**
   * Local Storage methods for data persistence
   */
  private saveDevicesToLocalStorage(devices: SensorDevice[]): void {
    localStorage.setItem('sensorDevices', JSON.stringify(devices));
  }

  private saveReadingsToLocalStorage(readings: SensorReading[]): void {
    localStorage.setItem('sensorReadingsHistory', JSON.stringify(readings));
  }

  private saveTrialsToLocalStorage(trials: HistoricalData[]): void {
    localStorage.setItem('sensorTrialsData', JSON.stringify(trials));
  }

  private initializeStorageFromLocalStorage(): void {
    const storedDevices = localStorage.getItem('sensorDevices');
    if (storedDevices) {
      this.devicesSubject.next(JSON.parse(storedDevices));
    }

    const storedReadings = localStorage.getItem('sensorReadingsHistory');
    if (storedReadings) {
      this.readingsHistorySubject.next(JSON.parse(storedReadings));
    }

    const storedTrials = localStorage.getItem('sensorTrialsData');
    if (storedTrials) {
      this.historicalDataSubject.next(JSON.parse(storedTrials));
    }
  }

  /**
   * Set polling interval (in milliseconds)
   */
  public setPollingInterval(interval: number): void {
    this.pollingInterval = interval;
  }

  /**
   * Get available sensors from device
   */
  public getSensorInfo(deviceId: string): Observable<any> {
    const device = this.devicesSubject.value.find(d => d.id === deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const url = `http://${device.ipAddress}:${device.port}/api/info`;
    return this.http.get(url).pipe(
      catchError(error => {
        console.error('Error fetching sensor info:', error);
        throw error;
      })
    );
  }
}
