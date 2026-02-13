import { Component, OnInit, OnDestroy } from '@angular/core';
import { SensorDataService } from '../services/sensor-data.service';
import { SensorReading, HistoricalData } from '../models/sensor-data.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements OnInit, OnDestroy {

  selectedSegment = 'live';

  // Analysis data
  trials: HistoricalData[] = [];
  selectedTrial: HistoricalData | null = null;
  readingsHistory: SensorReading[] = [];

  // Statistics
  avgTemperature = 0;
  avgTds = 0;
  avgEc = 0;
  avgPh = 0;
  
  minTemperature = 0;
  maxTemperature = 0;
  
  minTds = 0;
  maxTds = 0;

  minPh = 0;
  maxPh = 0;

  private destroy$ = new Subject<void>();

  constructor(private sensorDataService: SensorDataService) {}

  ngOnInit() {
    // Subscribe to readings history
    this.sensorDataService.readingsHistory$
      .pipe(takeUntil(this.destroy$))
      .subscribe(readings => {
        this.readingsHistory = readings;
        if (readings.length > 0) {
          this.calculateStatistics(readings);
        }
      });

    // Subscribe to trial data
    this.sensorDataService.historicalData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(trials => {
        this.trials = trials;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Calculate statistics from sensor readings
   */
  calculateStatistics(readings: SensorReading[]) {
    if (readings.length === 0) return;

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

  // regression helper removed

  /**
   * Helper function to calculate average
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
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
- Average: ${this.avgTemperature.toFixed(2)}°C
- Min: ${this.minTemperature.toFixed(2)}°C
- Max: ${this.maxTemperature.toFixed(2)}°C

TDS (Total Dissolved Solids) Analysis:
- Average: ${this.avgTds.toFixed(2)} ppm
- Min: ${this.minTds.toFixed(2)} ppm
- Max: ${this.maxTds.toFixed(2)} ppm

EC (Electrical Conductivity) Analysis:
- Average: ${this.avgEc.toFixed(2)} mS/cm

pH Level Analysis:
- Average: ${this.avgPh.toFixed(2)}
- Min: ${this.minPh.toFixed(2)}
- Max: ${this.maxPh.toFixed(2)}

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
