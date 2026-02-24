import { Component, OnInit } from '@angular/core';
import { SensorDataService } from './services/sensor-data.service';
import { SensorDevice } from './models/sensor-data.model';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(private sensorDataService: SensorDataService) {}

  ngOnInit() {
    // Initialize with Codespaces Flask server (accessible from Windows local machine)
    const devices: SensorDevice[] = [
      {
        id: 'local-arduino',
        name: 'Local Arduino',
        ipAddress: 'psychic-cod-695rx5696pqqf4p5r-5000.app.github.dev',
        port: 443,
        location: {
          latitude: 41.40338,
          longitude: 2.17403,
          name: 'Development'
        },
        lastSync: new Date(),
        status: 'online'
      }
    ];
    
    this.sensorDataService.initializeDevices(devices);
  }
}
