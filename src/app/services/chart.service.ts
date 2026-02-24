import { Injectable } from '@angular/core';
import { ChartConfiguration, Chart, Plugin } from 'chart.js';
import { SensorReading } from '../models/sensor-data.model';

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  constructor() {}

  /**
   * Create plugin to draw optimal range background
   */
  private createOptimalRangePlugin(min: number, max: number): Plugin {
    return {
      id: 'optimalRangeBackground',
      afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        const yScale = chart.scales['y'];
        const xScale = chart.scales['x'];

        if (!yScale || !xScale) return;

        const yMin = yScale.getPixelForValue(min);
        const yMax = yScale.getPixelForValue(max);
        const xStart = xScale.left;
        const xEnd = xScale.right;

        ctx.fillStyle = 'rgba(128, 128, 128, 0.15)';
        ctx.fillRect(xStart, yMax, xEnd - xStart, yMin - yMax);
      }
    };
  }

  /**
   * Format timestamps for short time window (60 seconds)
   */
  private formatTimestampsForWindow(readings: SensorReading[]): string[] {
    if (readings.length === 0) return [];
    
    const firstTime = new Date(readings[0].timestamp).getTime();
    return readings.map(r => {
      const readingTime = new Date(r.timestamp).getTime();
      const elapsedSeconds = Math.round((readingTime - firstTime) / 1000);
      return `${elapsedSeconds}s`;
    });
  }

  /**
   * Generate temperature trend chart configuration
   */
  getTemperatureChartConfig(readings: SensorReading[], showOptimalRange: boolean = true): ChartConfiguration {
    const timestamps = this.formatTimestampsForWindow(readings);
    const temperatures = readings.map(r => r.temperature);

    // Calculate dynamic Y-axis max with padding
    const tempMax = temperatures.length > 0 ? Math.max(...temperatures) : 30;
    const yAxisMax = Math.ceil(tempMax * 1.15); // 15% padding

    const config: any = {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temperatures,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#ff6b6b',
            pointBorderColor: '#fff',
            pointBorderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Temperature Trend'
          }
        },
        scales: {
          y: {
            min: 0,
            max: yAxisMax,
            title: {
              display: true,
              text: 'Temperature (°C)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Elapsed Time'
            }
          }
        }
      }
    };

    if (showOptimalRange) {
      config.plugins = [this.createOptimalRangePlugin(20, 25)];
    }

    return config;
  }

  // Regression chart removed per user request

  /**
   * Generate TDS trend chart configuration
   */
  getTdsChartConfig(readings: SensorReading[], showOptimalRange: boolean = true): ChartConfiguration {
    const timestamps = this.formatTimestampsForWindow(readings);
    const tdsList = readings.map(r => r.tds);

    // Calculate dynamic Y-axis max with 15% padding
    const tdsMax = tdsList.length > 0 ? Math.max(...tdsList) : 1500;
    const yAxisMax = Math.ceil(tdsMax * 1.15);

    const config: any = {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [
          {
            label: 'TDS (ppm)',
            data: tdsList,
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#4ecdc4',
            pointBorderColor: '#fff',
            pointBorderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'TDS Trend'
          }
        },
        scales: {
          y: {
            min: 0,
            max: yAxisMax,
            title: {
              display: true,
              text: 'TDS (ppm)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Elapsed Time'
            }
          }
        }
      }
    };

    if (showOptimalRange) {
      config.plugins = [this.createOptimalRangePlugin(500, 1000)];
    }

    return config;
  }

  /**
   * Generate multi-sensor comparison chart
   */
  getMultiSensorChartConfig(readings: SensorReading[]): ChartConfiguration {
    const timestamps = readings.map(r => new Date(r.timestamp).toLocaleTimeString());
    
    // Normalize values to 0-100 scale for comparison
    const normalizeTemperature = (t: number) => (t / 50) * 100; // Assuming max ~50°C
    const normalizeTds = (t: number) => Math.min((t / 1000) * 100, 100); // Assuming max ~1000 ppm
    const normalizeEc = (e: number) => (e / 5) * 100; // Assuming max ~5 mS/cm
    const normalizePh = (p: number) => (p / 14) * 100; // Assuming max 14

    return {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [
          {
            label: 'Temperature (%)',
            data: readings.map(r => normalizeTemperature(r.temperature)),
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.05)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#ff6b6b'
          },
          {
            label: 'TDS (%)',
            data: readings.map(r => normalizeTds(r.tds)),
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.05)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#4ecdc4'
          },
          {
            label: 'EC (%)',
            data: readings.map(r => normalizeEc(r.ec)),
            borderColor: '#ffe66d',
            backgroundColor: 'rgba(255, 230, 109, 0.05)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#ffe66d'
          },
          {
            label: 'pH (%)',
            data: readings.map(r => normalizePh(r.ph)),
            borderColor: '#95e1d3',
            backgroundColor: 'rgba(149, 225, 211, 0.05)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#95e1d3'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'All Sensors - Normalized Comparison'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Normalized Value (%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Time'
            }
          }
        }
      }
    };
  }

  /**
   * Generate pH trend chart configuration
   */
  getPhChartConfig(readings: SensorReading[], showOptimalRange: boolean = true): ChartConfiguration {
    const timestamps = this.formatTimestampsForWindow(readings);
    const phValues = readings.map(r => r.ph);

    // Calculate dynamic Y-axis max with 15% padding
    const phMax = phValues.length > 0 ? Math.max(...phValues) : 14;
    const yAxisMax = Math.ceil(phMax * 1.15);

    const config: any = {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [
          {
            label: 'pH Level',
            data: phValues,
            borderColor: '#95e1d3',
            backgroundColor: 'rgba(149, 225, 211, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#95e1d3',
            pointBorderColor: '#fff',
            pointBorderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'pH Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 0,
            max: yAxisMax,
            title: {
              display: true,
              text: 'pH'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Elapsed Time'
            }
          }
        }
      }
    };

    if (showOptimalRange) {
      config.plugins = [this.createOptimalRangePlugin(6.5, 7.5)];
    }

    return config;
  }

  /**
   * Generate EC trend chart configuration
   */
  getEcChartConfig(readings: SensorReading[], showOptimalRange: boolean = true): ChartConfiguration {
    const timestamps = this.formatTimestampsForWindow(readings);
    const ecValues = readings.map(r => r.ec);

    // Calculate dynamic Y-axis max with 15% padding
    const ecMax = ecValues.length > 0 ? Math.max(...ecValues) : 2.5;
    const yAxisMax = Math.ceil(ecMax * 1.15 * 100) / 100; // 15% padding, round to 2 decimals

    const config: any = {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [
          {
            label: 'EC (mS/cm)',
            data: ecValues,
            borderColor: '#ffe66d',
            backgroundColor: 'rgba(255, 230, 109, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#ffe66d',
            pointBorderColor: '#fff',
            pointBorderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'EC Trend'
          }
        },
        scales: {
          y: {
            min: 0,
            max: yAxisMax,
            title: {
              display: true,
              text: 'EC (mS/cm)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Elapsed Time'
            }
          }
        }
      }
    };

    if (showOptimalRange) {
      config.plugins = [this.createOptimalRangePlugin(1.0, 2.0)];
    }

    return config;
  }

  /**
   * Generate radar chart for sensor comparison
   */
  getRadarChartConfig(reading: SensorReading | null, maxValues?: { temperature: number, tds: number, ec: number, ph: number }): ChartConfiguration {
    if (!reading) {
      throw new Error('No sensor reading available for radar chart');
    }

    // Use provided max values or defaults
    const tempMax = maxValues?.temperature || 50;
    const tdsMax = maxValues?.tds || 1000;
    const ecMax = maxValues?.ec || 5;
    const phMax = maxValues?.ph || 14;

    return {
      type: 'radar',
      data: {
        labels: ['Temperature', 'TDS', 'EC', 'pH', 'Signal', 'Battery'],
        datasets: [
          {
            label: 'Current Reading',
            data: [
              (reading.temperature / tempMax) * 100,
              Math.min((reading.tds / tdsMax) * 100, 100),
              (reading.ec / ecMax) * 100,
              (reading.ph / phMax) * 100,
              Math.abs(reading.signalStrength) * 100 / 120,
              reading.batteryLevel
            ],
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.25)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#667eea'
          }
        ]
      },
      plugins: [
        {
          id: 'valueLabels',
          afterDatasetsDraw: (chart: any) => {
            const ctx = chart.ctx;
            const datasetMeta = chart.getDatasetMeta(0);
            const displayValues = [
              `${reading.temperature}°C`,
              `${reading.tds} ppm`,
              `${reading.ec} mS/cm`,
              `${reading.ph}`,
              `${reading.signalStrength} dBm`,
              `${reading.batteryLevel}%`
            ];

            ctx.save();
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#222';
            ctx.textAlign = 'center';

            datasetMeta.data.forEach((point: any, idx: number) => {
              const x = point.x;
              const y = point.y - 12;
              ctx.fillText(displayValues[idx], x, y);
            });

            ctx.restore();
          }
        }
      ],
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Sensor Status Overview'
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              display: false
            }
          }
        }
      }
    };
  }
}
