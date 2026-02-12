import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {

  battery = 0;
  signal = 0;
  latitude = 0;
  longitude = 0;
  mapUrl = '';

  constructor() {}

  ngOnInit() {
    this.loadLiveData();
    this.generateMapUrl();
  }

  loadLiveData() {
    // TEMP mock data
    // later this becomes API / MQTT / WebSocket
    this.battery = 87;
    this.signal = -72;
    this.latitude = 41.40338;
    this.longitude = 2.17403;
  }

  generateMapUrl() {
    // Using Geoapify Static Maps API (free without authentication)
    const zoom = 15;
    const width = 300;
    const height = 200;
    
    this.mapUrl = `https://maps.geoapify.com/staticmap?` +
      `style=osm-bright` +
      `&width=${width}` +
      `&height=${height}` +
      `&center=lonlat:${this.longitude},${this.latitude}` +
      `&zoom=${zoom}` +
      `&marker=lonlat:${this.longitude},${this.latitude};color:%23FF0000;size:medium`;
    
    console.log('Generated Map URL:', this.mapUrl);
    console.log('Coordinates:', this.latitude, this.longitude);
  }

  onMapLoadError(event: any) {
    console.error('Map image failed to load:', event);
    console.log('URL attempted:', this.mapUrl);
  }

  refreshData() {
    this.loadLiveData();
    this.generateMapUrl();
  }
}
