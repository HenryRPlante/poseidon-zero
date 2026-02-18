import { Component, OnInit, SimpleChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { SensorReading } from '../../models/sensor-data.model';
import { ChartService } from '../../services/chart.service';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-sensor-chart',
  templateUrl: './sensor-chart.component.html',
  styleUrls: ['./sensor-chart.component.scss'],
  standalone: true,
  imports: [CommonModule, NgChartsModule]
})
export class SensorChartComponent implements OnInit {

  @Input() readings: SensorReading[] = [];
  @Input() chartType: 'temperature' | 'tds' | 'ec' | 'ph' | 'multi' | 'radar' = 'temperature';
  @Input() currentReading: SensorReading | null = null;
  @Input() showOptimalRange: boolean = true;

  chartConfig: ChartConfiguration | null = null;
  private mockDataGenerated = false;

  constructor(private chartService: ChartService) {}

  ngOnInit() {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Only update chart if readings, chartType, or currentReading changes
    // Skip updates when only showOptimalRange changes to prevent data regeneration
    if (changes['readings'] || changes['chartType'] || changes['currentReading']) {
      this.updateChart();
    } else if (changes['showOptimalRange'] && this.chartConfig) {
      // For showOptimalRange changes, just update the existing config without regenerating data
      this.updateChartPlugins();
    }
  }

  updateChart() {
    if (this.readings.length === 0 && !this.mockDataGenerated) {
      // Generate mock data only once
      this.generateMockChart();
      this.mockDataGenerated = true;
      return;
    }

    switch (this.chartType) {
      case 'temperature':
        this.chartConfig = this.chartService.getTemperatureChartConfig(this.readings, this.showOptimalRange);
        break;
      case 'tds':
        this.chartConfig = this.chartService.getTdsChartConfig(this.readings, this.showOptimalRange);
        break;
      case 'ec':
        this.chartConfig = this.chartService.getEcChartConfig(this.readings, this.showOptimalRange);
        break;
      case 'ph':
        this.chartConfig = this.chartService.getPhChartConfig(this.readings, this.showOptimalRange);
        break;
      case 'multi':
        this.chartConfig = this.chartService.getMultiSensorChartConfig(this.readings);
        break;
      case 'radar':
        this.chartConfig = this.chartService.getRadarChartConfig(this.currentReading);
        break;
      default:
        this.chartConfig = this.chartService.getTemperatureChartConfig(this.readings, this.showOptimalRange);
    }
  }

  /**
   * Update chart plugins when showOptimalRange changes without regenerating data
   */
  private updateChartPlugins(): void {
    if (!this.chartConfig) return;

    // Recreate config with same data but updated optimal range visibility
    const readings = this.readings.length > 0 ? this.readings : [];
    
    switch (this.chartType) {
      case 'temperature':
        this.chartConfig = this.chartService.getTemperatureChartConfig(readings, this.showOptimalRange);
        break;
      case 'tds':
        this.chartConfig = this.chartService.getTdsChartConfig(readings, this.showOptimalRange);
        break;
      case 'ec':
        this.chartConfig = this.chartService.getEcChartConfig(readings, this.showOptimalRange);
        break;
      case 'ph':
        this.chartConfig = this.chartService.getPhChartConfig(readings, this.showOptimalRange);
        break;
    }
  }

  /**
   * Generate mock data for demonstration when no real data is available
   */
  private generateMockChart() {
    // Generate 10 mock readings spaced 5 minutes apart
    const mockReadings: SensorReading[] = [];
    for (let i = 0; i < 10; i++) {
      mockReadings.push({
        timestamp: new Date(Date.now() - (10 - i) * 300000),
        tds: 400 + Math.random() * 100,
        temperature: 20 + Math.random() * 8,
        ec: 0.7 + Math.random() * 0.4,
        ph: 6.8 + Math.random() * 0.6,
        signalStrength: -80 + Math.random() * 20,
        batteryLevel: 80 + Math.random() * 15
      });
    }

    switch (this.chartType) {
      case 'temperature':
        this.chartConfig = this.chartService.getTemperatureChartConfig(mockReadings, this.showOptimalRange);
        break;
      case 'tds':
        this.chartConfig = this.chartService.getTdsChartConfig(mockReadings, this.showOptimalRange);
        break;
      case 'ec':
        this.chartConfig = this.chartService.getEcChartConfig(mockReadings, this.showOptimalRange);
        break;
      case 'ph':
        this.chartConfig = this.chartService.getPhChartConfig(mockReadings, this.showOptimalRange);
        break;
      case 'multi':
        this.chartConfig = this.chartService.getMultiSensorChartConfig(mockReadings);
        break;
      case 'radar':
        this.chartConfig = this.chartService.getRadarChartConfig(mockReadings[0]);
        break;
      default:
        this.chartConfig = this.chartService.getTemperatureChartConfig(mockReadings, this.showOptimalRange);
    }
  }
}
