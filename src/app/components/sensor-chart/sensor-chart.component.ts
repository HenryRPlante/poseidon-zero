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
    const hasReadings = this.readings.length > 0;
    const hasCurrentReading = !!this.currentReading;

    if (!hasReadings && this.chartType !== 'radar') {
      this.chartConfig = null;
      return;
    }

    if (this.chartType === 'radar' && !hasCurrentReading) {
      this.chartConfig = null;
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
}
