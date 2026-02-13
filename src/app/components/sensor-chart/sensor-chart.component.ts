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

  chartConfig: ChartConfiguration | null = null;

  constructor(private chartService: ChartService) {}

  ngOnInit() {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['readings'] || changes['chartType'] || changes['currentReading']) {
      this.updateChart();
    }
  }

  updateChart() {
    if (this.readings.length === 0) {
      // Generate mock data for empty state
      this.generateMockChart();
      return;
    }

    switch (this.chartType) {
      case 'temperature':
        this.chartConfig = this.chartService.getTemperatureChartConfig(this.readings);
        break;
      case 'tds':
        this.chartConfig = this.chartService.getTdsChartConfig(this.readings);
        break;
      case 'ec':
        this.chartConfig = this.chartService.getEcChartConfig(this.readings);
        break;
      case 'ph':
        this.chartConfig = this.chartService.getPhChartConfig(this.readings);
        break;
      case 'multi':
        this.chartConfig = this.chartService.getMultiSensorChartConfig(this.readings);
        break;
      case 'radar':
        this.chartConfig = this.chartService.getRadarChartConfig(this.currentReading);
        break;
      default:
        this.chartConfig = this.chartService.getTemperatureChartConfig(this.readings);
    }
  }

  /**
   * Generate mock data for demonstration when no real data is available
   */
  private generateMockChart() {
    // Generate 10 mock readings
    const mockReadings: SensorReading[] = [];
    for (let i = 0; i < 10; i++) {
      mockReadings.push({
        timestamp: new Date(Date.now() - (10 - i) * 30000),
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
        this.chartConfig = this.chartService.getTemperatureChartConfig(mockReadings);
        break;
      case 'tds':
        this.chartConfig = this.chartService.getTdsChartConfig(mockReadings);
        break;
      case 'ec':
        this.chartConfig = this.chartService.getEcChartConfig(mockReadings);
        break;
      case 'ph':
        this.chartConfig = this.chartService.getPhChartConfig(mockReadings);
        break;
      case 'multi':
        this.chartConfig = this.chartService.getMultiSensorChartConfig(mockReadings);
        break;
      case 'radar':
        this.chartConfig = this.chartService.getRadarChartConfig(mockReadings[0]);
        break;
      default:
        this.chartConfig = this.chartService.getTemperatureChartConfig(mockReadings);
    }
  }
}
