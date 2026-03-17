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
        ipAddress: 'organic-cod-r46r56949rvjf5qwx-5000.app.github.dev',
        port: 443,
        location: {
          latitude: 32.783,
          longitude: -79.938,
          name: 'Development'
        },
        lastSync: new Date(),
        status: 'online'
      }
    ];
    
    // Clear all old data to start fresh
    this.sensorDataService.clearReadingsHistory();
    
    this.sensorDataService.initializeDevices(devices);
  }
}
