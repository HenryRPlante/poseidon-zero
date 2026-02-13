import { Injectable } from '@angular/core';
import { ChartConfiguration, Chart } from 'chart.js';
import { SensorReading } from '../models/sensor-data.model';

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  constructor() {}

  /**
   * Generate temperature trend chart configuration
   */
  getTemperatureChartConfig(readings: SensorReading[]): ChartConfiguration {
    const timestamps = readings.map(r => new Date(r.timestamp).toLocaleTimeString());
    const temperatures = readings.map(r => r.temperature);

    return {
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
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ff6b6b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
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
            text: 'Water Temperature Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Temperature (°C)'
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

  // Regression chart removed per user request

  /**
   * Generate TDS trend chart configuration
   */
  getTdsChartConfig(readings: SensorReading[]): ChartConfiguration {
    const timestamps = readings.map(r => new Date(r.timestamp).toLocaleTimeString());
    const tdsList = readings.map(r => r.tds);

    return {
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
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#4ecdc4',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
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
            text: 'TDS (Total Dissolved Solids) Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'TDS (ppm)'
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
  getPhChartConfig(readings: SensorReading[]): ChartConfiguration {
    const timestamps = readings.map(r => new Date(r.timestamp).toLocaleTimeString());
    const phValues = readings.map(r => r.ph);

    return {
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
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#95e1d3',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
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
            text: 'pH Level Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 0,
            max: 14,
            title: {
              display: true,
              text: 'pH'
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
   * Generate EC trend chart configuration
   */
  getEcChartConfig(readings: SensorReading[]): ChartConfiguration {
    const timestamps = readings.map(r => new Date(r.timestamp).toLocaleTimeString());
    const ecValues = readings.map(r => r.ec);

    return {
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
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ffe66d',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
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
            text: 'Electrical Conductivity Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'EC (mS/cm)'
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
   * Generate radar chart for sensor comparison
   */
  getRadarChartConfig(reading: SensorReading | null): ChartConfiguration {
    if (!reading) {
      reading = {
        timestamp: new Date(),
        tds: 450,
        temperature: 22,
        ec: 0.8,
        ph: 7.2,
        signalStrength: -72,
        batteryLevel: 87
      };
    }

    return {
      type: 'radar',
      data: {
        labels: ['Temperature', 'TDS', 'EC', 'pH', 'Signal', 'Battery'],
        datasets: [
          {
            label: 'Current Reading',
            data: [
              (reading.temperature / 50) * 100,
              Math.min((reading.tds / 1000) * 100, 100),
              (reading.ec / 5) * 100,
              (reading.ph / 14) * 100,
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
