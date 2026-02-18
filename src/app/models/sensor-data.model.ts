/**
 * Sensor Data Models for Arduino-based water quality monitoring
 * Supports TDS, Temperature, EC (Electrical Conductivity), and pH sensors
 */

export interface SensorReading {
  timestamp: Date;
  tds: number;           // Total Dissolved Solids (ppm)
  temperature: number;   // Water temperature (°C)
  ec: number;            // Electrical Conductivity (mS/cm)
  ph: number;            // pH level (0-14)
  signalStrength: number; // Cellular signal strength (dBm)
  batteryLevel: number;  // Device battery percentage (0-100)
}

export interface SensorDevice {
  id: string;
  name: string;
  ipAddress: string;
  port: number;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  lastSync: Date;
  status: 'online' | 'offline' | 'error';
}

export interface SensorDataResponse {
  success: boolean;
  data?: SensorReading;
  error?: string;
  timestamp: Date;
}

export interface HistoricalData {
  trialId: string;
  trialName: string;
  readings: SensorReading[];
  startTime: Date;
  endTime: Date;
  location: string;
}
