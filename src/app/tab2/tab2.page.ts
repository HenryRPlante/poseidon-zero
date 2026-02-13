import { Component, OnInit, OnDestroy } from '@angular/core';
import { SensorDataService } from '../services/sensor-data.service';
import { SensorReading, HistoricalData } from '../models/sensor-data.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit, OnDestroy {

  selectedSegment = 'live';

  // Live readings
  waterTemp = 0;
  turbidity = 0;
  tds = 0;
  ec = 0;
  ph = 0;

  // Trial data
  trials: HistoricalData[] = [];
  selectedTrial: HistoricalData | null = null;
  readingsHistory: SensorReading[] = [];

  private destroy$ = new Subject<void>();

  constructor(private sensorDataService: SensorDataService) {}

  ngOnInit() {
    // Subscribe to current sensor reading (live data)
    this.sensorDataService.currentReading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(reading => {
        if (reading) {
          this.waterTemp = reading.temperature;
          this.tds = reading.tds;
          this.ec = reading.ec;
          this.ph = reading.ph;
          // Turbidity would come from additional sensor if available
          this.turbidity = 3.1; // Placeholder
        }
      });

    // Subscribe to readings history
    this.sensorDataService.readingsHistory$
      .pipe(takeUntil(this.destroy$))
      .subscribe(readings => {
        this.readingsHistory = readings;
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

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    
    if (this.selectedSegment !== 'live') {
      // Load the selected trial data
      const trial = this.trials.find(t => t.trialId === this.selectedSegment);
      if (trial) {
        this.selectedTrial = trial;
        this.loadTrialData(trial);
      }
    }
  }

  loadTrialData(trial: HistoricalData) {
    // Display the first reading from the trial as sample
    if (trial.readings.length > 0) {
      const firstReading = trial.readings[0];
      this.waterTemp = firstReading.temperature;
      this.tds = firstReading.tds;
      this.ec = firstReading.ec;
      this.ph = firstReading.ph;
    }
  }

  startNewTrial(trialName: string) {
    const trialId = `trial_${Date.now()}`;
    const newTrial: HistoricalData = {
      trialId,
      trialName,
      readings: [...this.readingsHistory],
      startTime: new Date(),
      endTime: new Date(),
      location: 'Current Location'
    };
    
    this.sensorDataService.saveTrialData(newTrial);
  }

  exportTrialData(trial: HistoricalData) {
    const csvContent = this.convertTrialToCSV(trial);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${trial.trialName}_${Date.now()}.csv`);
    link.click();
  }

  private convertTrialToCSV(trial: HistoricalData): string {
    let csv = 'Timestamp,TDS (ppm),Temperature (°C),EC (mS/cm),pH,Signal,Battery\n';
    
    trial.readings.forEach(reading => {
      const row = [
        new Date(reading.timestamp).toISOString(),
        reading.tds,
        reading.temperature,
        reading.ec,
        reading.ph,
        reading.signalStrength,
        reading.batteryLevel
      ].join(',');
      csv += row + '\n';
    });

    return csv;
  }
}
