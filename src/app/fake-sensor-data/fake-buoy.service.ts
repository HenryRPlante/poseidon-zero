import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SensorReading } from '../models/sensor-data.model';

/**
 * FAKE BUOY SERVICE - FOR TESTING/DEMO PURPOSES ONLY
 * 
 * This service generates mock sensor data to simulate a real buoy device.
 * Delete this entire folder when integrating with real Arduino hardware.
 * 
 * Location: /src/app/fake-sensor-data/
 */

@Injectable({
  providedIn: 'root'
})
export class FakeBuoyService {

  private readingsHistorySubject = new BehaviorSubject<SensorReading[]>([]);
  public readingsHistory$ = this.readingsHistorySubject.asObservable();

  private currentReadingSubject = new BehaviorSubject<SensorReading | null>(null);
  public currentReading$ = this.currentReadingSubject.asObservable();

  private isRunning = false;
  private destroy$ = new BehaviorSubject<void>(void 0);
  private updateInterval = 300000; // 5 minutes in milliseconds

  constructor() {
    this.initializeWithMockData();
  }

  /**
   * Initialize with 10 readings spaced 5 minutes apart
   */
  private initializeWithMockData(): void {
    const readings: SensorReading[] = [];
    const now = Date.now();

    for (let i = 9; i >= 0; i--) {
      readings.push(this.generateRandomReading(new Date(now - (i * this.updateInterval))));
    }

    this.readingsHistorySubject.next(readings);
    if (readings.length > 0) {
      this.currentReadingSubject.next(readings[readings.length - 1]);
    }
  }

  /**
   * Start auto-updating sensor data every 5 minutes
   */
  public startAutoUpdate(): void {
    if (this.isRunning) {
      console.warn('Fake buoy service is already running');
      return;
    }

    this.isRunning = true;

    interval(this.updateInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.generateAndAddReading();
      });
  }

  /**
   * Stop auto-updating sensor data
   */
  public stopAutoUpdate(): void {
    this.isRunning = false;
    this.destroy$.next();
  }

  /**
   * Generate and add a new reading to the history
   */
  private generateAndAddReading(): void {
    const newReading = this.generateRandomReading(new Date());
    const history = this.readingsHistorySubject.value;
    
    history.push(newReading);

    // Keep only last 100 readings
    if (history.length > 100) {
      history.shift();
    }

    this.readingsHistorySubject.next([...history]);
    this.currentReadingSubject.next(newReading);
  }

  /**
   * Generate a random sensor reading with realistic variations
   */
  private generateRandomReading(timestamp: Date): SensorReading {
    // Base values (these would come from real sensors)
    const baseTemp = 22;
    const baseTds = 650;
    const baseEc = 1.2;
    const basePh = 7.2;

    return {
      timestamp,
      temperature: baseTemp + (Math.random() - 0.5) * 4, // ±2°C variation
      tds: baseTds + (Math.random() - 0.5) * 200, // ±100 ppm variation
      ec: baseEc + (Math.random() - 0.5) * 0.4, // ±0.2 mS/cm variation
      ph: basePh + (Math.random() - 0.5) * 0.6, // ±0.3 pH variation
      signalStrength: -75 + Math.random() * 20, // -75 to -55 dBm
      batteryLevel: 85 + Math.random() * 10 // 85-95%
    };
  }

  /**
   * Get all readings history
   */
  public getReadingsHistory(): SensorReading[] {
    return this.readingsHistorySubject.value;
  }

  /**
   * Get current reading
   */
  public getCurrentReading(): SensorReading | null {
    return this.currentReadingSubject.value;
  }

  /**
   * Manually trigger a new reading (for testing)
   */
  public manuallyGenerateReading(): void {
    this.generateAndAddReading();
  }

  /**
   * Clear all readings
   */
  public clearReadings(): void {
    this.readingsHistorySubject.next([]);
    this.currentReadingSubject.next(null);
  }

  /**
   * Reset to initial mock data
   */
  public reset(): void {
    this.stopAutoUpdate();
    this.clearReadings();
    this.initializeWithMockData();
  }
}
