import { Component, OnInit, OnDestroy } from '@angular/core';
import { SensorDataService } from '../services/sensor-data.service';
import { SensorReading, SensorDevice } from '../models/sensor-data.model';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import * as L from 'leaflet';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit, OnDestroy {

  battery: number | null = null;
  latitude = 0;
  longitude = 0;
  isLoading = false;
  deviceStatus = 'offline';

  currentReading: SensorReading | null = null;
  selectedDevice: SensorDevice | null = null;
  devices: SensorDevice[] = [];
  private map: L.Map | null = null;
  private locationMarker: L.CircleMarker | null = null;

  private destroy$ = new Subject<void>();
  private pollingActive = false;

  get sensorDetectionText(): string {
    if (this.devices.length === 0) {
      return 'Detecting sensors...';
    }
    return `Connected: ${this.devices.map(device => device.name).join(', ')}`;
  }

  constructor(private sensorDataService: SensorDataService) {}

  ngOnInit() {
    // Set up device display without polling
    this.sensorDataService.setPollingInterval(2000);

    // Subscribe to devices only for display
    this.sensorDataService.devices$
      .pipe(takeUntil(this.destroy$))
      .subscribe(devices => {
        this.devices = devices;
        if (devices.length > 0 && !this.selectedDevice) {
          this.selectedDevice = devices[0];
          this.latitude = this.selectedDevice.location.latitude;
          this.longitude = this.selectedDevice.location.longitude;
          this.initializeOrUpdateMap();
          this.deviceStatus = 'online';
        }
      });

    this.loadLiveData();
  }

  /**
   * Start continuous polling of sensor data
   */
  private startAutoPolling() {
    if (this.pollingActive) return;
    this.pollingActive = true;

    // Poll every 2 seconds
    interval(2000)
      .pipe(
        switchMap(() => {
          if (this.selectedDevice) {
            return this.sensorDataService.fetchSensorData(this.selectedDevice!.id);
          }
          return [];
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (reading) => {
          this.currentReading = reading;
          this.battery = reading.batteryLevel ?? null;
          this.deviceStatus = 'online';
        },
        error: (error) => {
          console.error('Polling error:', error);
          this.deviceStatus = 'offline';
        }
      });
  }

  ionViewDidEnter() {
    setTimeout(() => {
      this.initializeOrUpdateMap();
    }, 0);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.pollingActive = false;
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
            this.battery = reading.batteryLevel ?? null;
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

  private initializeOrUpdateMap() {
    if (!Number.isFinite(this.latitude) || !Number.isFinite(this.longitude)) {
      return;
    }

    const coordinates: L.LatLngExpression = [this.latitude, this.longitude];

    if (!this.map) {
      this.map = L.map('tab1-map', {
        zoomControl: true,
        attributionControl: true
      }).setView(coordinates, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
    } else {
      this.map.setView(coordinates, this.map.getZoom());
    }

    if (this.locationMarker) {
      this.locationMarker.remove();
    }

    this.locationMarker = L.circleMarker(coordinates, {
      radius: 8,
      color: '#d32f2f',
      fillColor: '#d32f2f',
      fillOpacity: 0.9,
      weight: 2
    })
      .addTo(this.map)
      .bindPopup('Buoy Location');

    this.map.invalidateSize();
  }

  refreshData() {
    this.loadLiveData();
  }

  selectDevice(device: SensorDevice) {
    this.selectedDevice = device;
    this.latitude = device.location.latitude;
    this.longitude = device.location.longitude;
    this.initializeOrUpdateMap();
    this.loadLiveData();
  }
}
