import { Component, OnInit, OnDestroy } from '@angular/core';
import { SensorDataService } from '../services/sensor-data.service';
import { SensorReading, HistoricalData, SensorDevice } from '../models/sensor-data.model';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements OnInit, OnDestroy {

  selectedSegment = 'live';
  showOptimalRanges = {
    temperature: true,
    tds: true,
    ec: true,
    ph: true
  };

  // Analysis data
  trials: HistoricalData[] = [];
  selectedTrial: HistoricalData | null = null;
  readingsHistory: SensorReading[] = [];
  devices: SensorDevice[] = [];

  // Chart data (rolling 60-second window)
  chartReadingsHistory: SensorReading[] = [];

  // Statistics
  avgTemperature: number | null = null;
  avgTds: number | null = null;
  avgEc: number | null = null;
  avgPh: number | null = null;
  
  minTemperature: number | null = null;
  maxTemperature: number | null = null;
  
  minTds: number | null = null;
  maxTds: number | null = null;

  minPh: number | null = null;
  maxPh: number | null = null;

  private destroy$ = new Subject<void>();
  private pollingActive = false;
  private lastChartUpdate = 0;
  private chartUpdateInterval = 5000; // Update chart every 5 seconds
  private readonly CHART_WINDOW_MS = 60000; // 60 seconds rolling window

  get sensorDetectionText(): string {
    if (this.devices.length === 0) {
      return 'Detecting sensors...';
    }
    return `Connected: ${this.devices.map(device => device.name).join(', ')}`;
  }

  constructor(private sensorDataService: SensorDataService) {}

  ngOnInit() {
    // Subscribe to devices and start independent polling
    this.sensorDataService.devices$
      .pipe(takeUntil(this.destroy$))
      .subscribe(devices => {
        this.devices = devices;
        if (devices.length > 0 && !this.pollingActive) {
          this.startAutoPolling(devices[0].id);
        }
      });

    // Subscribe to trial data
    this.sensorDataService.historicalData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(trials => {
        this.trials = trials;
      });
  }

  private startAutoPolling(deviceId: string) {
    if (this.pollingActive) return;
    this.pollingActive = true;

    // Poll every 2 seconds
    interval(2000)
      .pipe(
        switchMap(() => this.sensorDataService.fetchSensorData(deviceId)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (reading) => {
          this.readingsHistory.push(reading);
          this.calculateStatistics(this.readingsHistory);
          
          // Update chart every 5 seconds based on time
          const now = Date.now();
          if (now - this.lastChartUpdate >= this.chartUpdateInterval) {
            this.updateChartData();
            this.lastChartUpdate = now;
          }
        },
        error: (error) => {
          console.error('Error polling Tab3 data:', error);
        }
      });
  }

  private updateChartData() {
    // Remove readings older than 60 seconds
    const cutoffTime = Date.now() - this.CHART_WINDOW_MS;
    this.chartReadingsHistory = this.readingsHistory.filter(r => {
      const readingTime = new Date(r.timestamp).getTime();
      return readingTime >= cutoffTime;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle visibility of optimal range for a specific measurement
   */
  toggleOptimalRange(measurement: keyof typeof this.showOptimalRanges) {
    this.showOptimalRanges[measurement] = !this.showOptimalRanges[measurement];
  }

  /**
   * Calculate statistics from sensor readings
   */
  calculateStatistics(readings: SensorReading[]) {
    if (readings.length === 0) {
      this.clearStatistics();
      return;
    }

    // Temperature statistics
    const temperatures = readings.map(r => r.temperature);
    this.avgTemperature = this.calculateAverage(temperatures);
    this.minTemperature = Math.min(...temperatures);
    this.maxTemperature = Math.max(...temperatures);

    // TDS statistics
    const tdsList = readings.map(r => r.tds);
    this.avgTds = this.calculateAverage(tdsList);
    this.minTds = Math.min(...tdsList);
    this.maxTds = Math.max(...tdsList);

    // EC statistics
    const ecList = readings.map(r => r.ec);
    this.avgEc = this.calculateAverage(ecList);

    // pH statistics
    const phList = readings.map(r => r.ph);
    this.avgPh = this.calculateAverage(phList);
    this.minPh = Math.min(...phList);
    this.maxPh = Math.max(...phList);

    // regression analysis removed per request
  }

  private clearStatistics() {
    this.avgTemperature = null;
    this.avgTds = null;
    this.avgEc = null;
    this.avgPh = null;
    this.minTemperature = null;
    this.maxTemperature = null;
    this.minTds = null;
    this.maxTds = null;
    this.minPh = null;
    this.maxPh = null;
  }

  // regression helper removed

  /**
   * Helper function to calculate average
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private formatStat(value: number | null, suffix: string = ''): string {
    if (value === null || value === undefined) {
      return '---';
    }
    return `${value.toFixed(2)}${suffix}`;
  }

  /**
   * Get analysis for a selected trial
   */
  selectTrial(trial: HistoricalData) {
    this.selectedTrial = trial;
    if (trial.readings.length > 0) {
      this.calculateStatistics(trial.readings);
    }
  }

  /**
   * Compare two trials
   */
  compareTrials(trial1: HistoricalData, trial2: HistoricalData) {
    // This would implement comparison logic between two trials
    console.log('Comparing trials:', trial1.trialId, trial2.trialId);
  }

  /**
   * Generate analysis report
   */
  generateReport(trial: HistoricalData) {
    const report = `
Water Quality Analysis Report
=============================
Trial: ${trial.trialName}
Location: ${trial.location}
Date: ${new Date(trial.startTime).toLocaleDateString()}

Temperature Analysis:
- Average: ${this.formatStat(this.avgTemperature, '°C')}
- Min: ${this.formatStat(this.minTemperature, '°C')}
- Max: ${this.formatStat(this.maxTemperature, '°C')}

TDS (Total Dissolved Solids) Analysis:
- Average: ${this.formatStat(this.avgTds, ' ppm')}
- Min: ${this.formatStat(this.minTds, ' ppm')}
- Max: ${this.formatStat(this.maxTds, ' ppm')}

EC (Electrical Conductivity) Analysis:
- Average: ${this.formatStat(this.avgEc, ' mS/cm')}

pH Level Analysis:
- Average: ${this.formatStat(this.avgPh)}
- Min: ${this.formatStat(this.minPh)}
- Max: ${this.formatStat(this.maxPh)}

  Linear Regression Analysis: removed
    `;

    // Download report as text file
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${trial.trialName}_analysis_${Date.now()}.txt`);
    link.click();
  }
}
