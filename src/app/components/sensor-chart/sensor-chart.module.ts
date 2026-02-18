import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';

import { SensorChartComponent } from './sensor-chart.component';

@NgModule({
  imports: [
    CommonModule,
    NgChartsModule
  ],
  declarations: [SensorChartComponent],
  exports: [SensorChartComponent]
})
export class SensorChartModule { }
