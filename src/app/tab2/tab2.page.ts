import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { SensorDataService } from '../services/sensor-data.service';
import { SensorReading, HistoricalData, SensorDevice } from '../models/sensor-data.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit, OnDestroy {

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInputTrial', { static: false }) fileInputTrial!: ElementRef<HTMLInputElement>;

  selectedSegment = 'live';

  // Live readings
  waterTemp: number | null = null;
  tds: number | null = null;
  ph: number | null = null;
  ec: number | null = null;

  // Trial data
  trials: HistoricalData[] = [];
  selectedTrial: HistoricalData | null = null;
  readingsHistory: SensorReading[] = [];
  devices: SensorDevice[] = [];

  private destroy$ = new Subject<void>();

  constructor(private sensorDataService: SensorDataService) {}

  ngOnInit() {
    // Subscribe to global readings history stream
    this.sensorDataService.readingsHistory$
      .pipe(takeUntil(this.destroy$))
      .subscribe(readings => {
        this.readingsHistory = readings;
        
        // Update current values from the latest reading
        if (readings.length > 0) {
          const latest = readings[readings.length - 1];
          this.waterTemp = latest.temperature ?? null;
          this.tds = latest.tds ?? null;
          this.ph = latest.ph ?? null;
          this.ec = latest.ec ?? null;
        }
      });

    // Subscribe to devices (for display purposes)
    this.sensorDataService.devices$
      .pipe(takeUntil(this.destroy$))
      .subscribe(devices => {
        this.devices = devices;
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
      this.ph = firstReading.ph;
      this.ec = firstReading.ec;
    }
  }

  startNewTrial(trialName: string) {
    const trialId = `trial_${Date.now()}`;
    // Use device location if available, otherwise default to 'Unknown Location'
    const location = this.devices.length > 0 && this.devices[0].location
      ? this.devices[0].location.name
      : 'Unknown Location';
    
    const newTrial: HistoricalData = {
      trialId,
      trialName,
      readings: [...this.readingsHistory],
      startTime: new Date(),
      endTime: new Date(),
      location
    };
    
    this.sensorDataService.saveTrialData(newTrial);
  }

  exportTrialData(trial: HistoricalData) {
    const csvContent = this.convertReadingsToCSV(trial.readings);
    this.triggerDownload(csvContent, `${trial.trialName}_${Date.now()}.txt`);
  }

  exportLastFiveMinutesData() {
    const lastFiveMinutesReadings = this.getLastFiveMinutesReadings();
    if (lastFiveMinutesReadings.length === 0) {
      console.warn('No readings to export');
      return;
    }

    const csvContent = this.convertReadingsToCSV(lastFiveMinutesReadings);
    console.log('CSV Content length:', csvContent.length);
    this.triggerDownload(csvContent, `sensor_data_last_5_minutes_${Date.now()}.txt`);
  }

  clearAllData() {
    if (confirm('Are you sure you want to delete all sensor data?')) {
      this.sensorDataService.clearReadingsHistory();
      console.log('All sensor data cleared');
    }
  }

  importData() {
    // Trigger the file input click
    if (this.selectedSegment === 'live' && this.fileInput) {
      this.fileInput.nativeElement.click();
    } else if (this.fileInputTrial) {
      this.fileInputTrial.nativeElement.click();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const content = e.target?.result as string;
        const readings = this.parseImportedData(content);
        
        if (readings.length > 0) {
          // Add imported readings to the service
          this.sensorDataService.addImportedReadings(readings);
          
          alert(`Successfully imported ${readings.length} readings!`);
          console.log(`Imported ${readings.length} readings from file`);
        } else {
          alert('No valid readings found in the file.');
        }
      } catch (error) {
        console.error('Error parsing imported file:', error);
        alert('Error parsing file. Please ensure it\'s a valid exported data file.');
      }
      
      // Reset the input so the same file can be selected again if needed
      input.value = '';
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      alert('Error reading file.');
      input.value = '';
    };
    
    reader.readAsText(file);
  }

  private parseImportedData(content: string): SensorReading[] {
    const readings: SensorReading[] = [];
    
    // Split by the separator '---' to get individual readings
    const blocks = content.split('---').filter(block => block.trim().length > 0);
    
    console.log(`Found ${blocks.length} data blocks to parse`);
    
    for (const block of blocks) {
      try {
        const lines = block.trim().split('\n');
        const reading: any = {};
        
        for (const line of lines) {
          if (!line.includes(':')) continue; // Skip empty or invalid lines
          
          const colonIndex = line.indexOf(':');
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          
          if (key === 'timestamp') {
            // Parse timestamp in format "MM/DD/YYYY HH:MM:SS"
            reading.timestamp = new Date(value);
            if (isNaN(reading.timestamp.getTime())) {
              console.error('Invalid timestamp:', value);
            }
          } else if (key === 'tds') {
            reading.tds = parseFloat(value);
          } else if (key === 'temperature') {
            reading.temperature = parseFloat(value);
          } else if (key === 'ph') {
            reading.ph = parseFloat(value);
          } else if (key === 'ec') {
            reading.ec = parseFloat(value);
          } else if (key === 'battery') {
            reading.batteryLevel = parseFloat(value);
          }
        }
        
        // Validate that we have the required fields
        const isValid = reading.timestamp && !isNaN(reading.timestamp.getTime()) &&
            !isNaN(reading.tds) &&
            !isNaN(reading.temperature) &&
            !isNaN(reading.ph) &&
            !isNaN(reading.ec);
            
        if (isValid) {
          // Set default battery level if not present
          if (reading.batteryLevel === undefined || isNaN(reading.batteryLevel)) {
            reading.batteryLevel = 100;
          }
          readings.push(reading as SensorReading);
        } else {
          console.warn('Invalid reading block:', { reading, block: block.substring(0, 100) });
        }
      } catch (error) {
        console.error('Error parsing reading block:', error, block.substring(0, 100));
        // Continue to next block
      }
    }
    
    console.log(`Successfully parsed ${readings.length} readings`);
    return readings;
  }

  private triggerDownload(content: string, filename: string) {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const objUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Use a small delay to ensure the link is ready
      setTimeout(() => {
        link.click();
        
        // Clean up after a longer delay to ensure download initiation
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(objUrl);
        }, 500);
      }, 50);
    } catch (error) {
      console.error('Error triggering download:', error);
    }
  }

  get lastFiveMinutesReadingsCount(): number {
    return this.getLastFiveMinutesReadings().length;
  }

  private getLastFiveMinutesReadings(): SensorReading[] {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return this.readingsHistory.filter(reading => {
      const readingTime = new Date(reading.timestamp).getTime();
      return !Number.isNaN(readingTime) && readingTime >= fiveMinutesAgo;
    });
  }

  private convertReadingsToCSV(readings: SensorReading[]): string {
    // Filter readings to be spaced at least 10 seconds apart
    const filteredReadings = this.filterReadingsByInterval(readings, 10000); // 10 seconds in ms
    
    // Format as bracketed text
    let text = '';
    
    filteredReadings.forEach(reading => {
      const timestamp = new Date(reading.timestamp);
      const formattedDate = timestamp.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      const formattedTime = timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      text += `timestamp: ${formattedDate} ${formattedTime}\n`;
      text += `tds: ${(reading.tds ?? 0).toFixed(1)}\n`;
      text += `temperature: ${(reading.temperature ?? 0).toFixed(2)}\n`;
      text += `ph: ${(reading.ph ?? 0).toFixed(2)}\n`;
      text += `ec: ${(reading.ec ?? 0).toFixed(3)}\n`;
      text += `battery: ${(reading.batteryLevel ?? 0).toFixed(0)}\n`;
      text += '---\n';
    });

    return text;
  }

  /**
   * Filter readings to maintain minimum time interval between readings
   */
  private filterReadingsByInterval(readings: SensorReading[], intervalMs: number): SensorReading[] {
    if (readings.length === 0) return [];
    
    const filtered: SensorReading[] = [readings[0]]; // Always include first reading
    let lastTimestamp = new Date(readings[0].timestamp).getTime();
    
    for (let i = 1; i < readings.length; i++) {
      const currentTimestamp = new Date(readings[i].timestamp).getTime();
      if (currentTimestamp - lastTimestamp >= intervalMs) {
        filtered.push(readings[i]);
        lastTimestamp = currentTimestamp;
      }
    }
    
    return filtered;
  }
}
