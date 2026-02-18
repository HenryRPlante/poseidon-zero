import { Component, OnInit, OnDestroy } from '@angular/core';
import { SensorDataService } from '../services/sensor-data.service';
import { SensorReading, SensorDevice } from '../models/sensor-data.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit, OnDestroy {

  battery = 0;
  signal = 0;
  latitude = 0;
  longitude = 0;
  mapUrl = '';
  isLoading = false;
  deviceStatus = 'offline';

  currentReading: SensorReading | null = null;
  selectedDevice: SensorDevice | null = null;
  devices: SensorDevice[] = [];

  private destroy$ = new Subject<void>();

  constructor(private sensorDataService: SensorDataService) {}

  ngOnInit() {
    // Subscribe to devices
    this.sensorDataService.devices$
      .pipe(takeUntil(this.destroy$))
      .subscribe(devices => {
        this.devices = devices;
        if (devices.length > 0 && !this.selectedDevice) {
          this.selectedDevice = devices[0];
          this.latitude = this.selectedDevice.location.latitude;
          this.longitude = this.selectedDevice.location.longitude;
        }
      });

    // Subscribe to current sensor reading
    this.sensorDataService.currentReading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(reading => {
        if (reading) {
          this.currentReading = reading;
          this.battery = 87; // In a real scenario, this would come from the sensor reading
          this.signal = -72; // In a real scenario, this would come from the sensor reading
        }
      });

    this.loadLiveData();
    this.generateMapUrl();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLiveData() {
    this.isLoading = true;
    
    if (this.selectedDevice) {
      this.sensorDataService.fetchSensorData(this.selectedDevice.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (reading) => {
            this.currentReading = reading;
            this.battery = 87;
            this.signal = -72;
            this.deviceStatus = 'online';
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading sensor data:', error);
            this.deviceStatus = 'offline';
            this.isLoading = false;
          }
        });
    }
  }

  generateMapUrl() {
    const zoom = 15;
    const width = 600;
    const height = 300;

    this.mapUrl =
      `https://static-maps.yandex.ru/1.x/?` +
      `ll=${this.longitude},${this.latitude}` +
      `&size=${width},${height}` +
      `&z=${zoom}` +
      `&l=map` +
      `&pt=${this.longitude},${this.latitude},pm2rdm`;
  }

  onMapLoadError(event: any) {
    console.error('Map image failed to load:', event);
    console.log('URL attempted:', this.mapUrl);
  }

  refreshData() {
    this.loadLiveData();
  }

  selectDevice(device: SensorDevice) {
    this.selectedDevice = device;
    this.latitude = device.location.latitude;
    this.longitude = device.location.longitude;
    this.generateMapUrl();
    this.loadLiveData();
  }
}
