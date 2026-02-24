#!/usr/bin/env python3
"""
Arduino Serial to HTTP Bridge
Reads sensor data from Arduino via USB serial and sends to Flask server
"""

import serial
import requests
import time
import sys
import json
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
FLASK_SERVER_URL = "http://localhost:5000/api/sensors"
BAUD_RATE = 9600
TIMEOUT = 2

class ArduinoSerialReader:
    def __init__(self, port, baud_rate=BAUD_RATE):
        self.port = port
        self.baud_rate = baud_rate
        self.serial_conn = None
        self.running = False
        
    def connect(self):
        """Connect to Arduino via serial port"""
        try:
            self.serial_conn = serial.Serial(
                port=self.port,
                baudrate=self.baud_rate,
                timeout=TIMEOUT
            )
            logger.info(f"✓ Connected to Arduino on {self.port} at {self.baud_rate} baud")
            return True
        except serial.SerialException as e:
            logger.error(f"✗ Failed to connect to {self.port}: {e}")
            return False
    
    def send_command(self, command):
        """Send command to Arduino"""
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.write(f"{command}\n".encode())
            time.sleep(0.1)
    
    def parse_sensor_line(self, line):
        """
        Parse sensor data line from Arduino
        Format: "25.5 | 7.20 | 450 | 0.865"
        Returns:  temp | pH | TDS | EC
        """
        try:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) == 4:
                return {
                    'temperature': float(parts[0]),
                    'ph': float(parts[1]),
                    'tds': float(parts[2]),
                    'ec': float(parts[3]),
                    'timestamp': datetime.utcnow().isoformat() + 'Z'
                }
        except (ValueError, IndexError) as e:
            pass
        return None
    
    def send_to_server(self, data):
        """Send sensor data to Flask server"""
        try:
            payload = {
                'data': data,
                'timestamp': data.get('timestamp')
            }
            response = requests.post(
                FLASK_SERVER_URL,
                json=payload,
                timeout=5
            )
            if response.status_code == 200:
                logger.info(f"✓ Data sent: Temp={data['temperature']}°C, pH={data['ph']}, TDS={data['tds']}ppm, EC={data['ec']}mS/cm")
                return True
            else:
                logger.warning(f"✗ Server returned {response.status_code}: {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"✗ Failed to send data to server: {e}")
            return False
    
    def run(self):
        """Main loop: read from Arduino and send to server"""
        if not self.connect():
            return False
        
        self.running = True
        logger.info("Starting sensor reader (press Ctrl+C to stop)...")
        
        # Give Arduino time to reset after connection
        time.sleep(2)
        
        # Send start command to Arduino
        self.send_command("start")
        logger.info("Sent 'start' command to Arduino")
        
        try:
            while self.running:
                if self.serial_conn and self.serial_conn.is_open:
                    try:
                        line = self.serial_conn.readline().decode().strip()
                        
                        if line:
                            # Skip Arduino startup messages and commands
                            if line.startswith('['):
                                logger.debug(f"Arduino: {line}")
                                continue
                            
                            # Try to parse as sensor data
                            sensor_data = self.parse_sensor_line(line)
                            if sensor_data:
                                self.send_to_server(sensor_data)
                            else:
                                # Log unparseable lines for debugging
                                if line and not line.startswith('Temp') and not line.startswith('---'):
                                    logger.debug(f"Could not parse: {line}")
                    
                    except UnicodeDecodeError:
                        logger.warning("Failed to decode serial data")
                        continue
                else:
                    logger.error("Serial connection lost")
                    break
        
        except KeyboardInterrupt:
            logger.info("\nStopping sensor reader...")
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
        finally:
            self.stop()
    
    def stop(self):
        """Close serial connection"""
        if self.serial_conn and self.serial_conn.is_open:
            self.send_command("stop")
            self.serial_conn.close()
            logger.info("✓ Serial connection closed")
        self.running = False


def find_arduino_port():
    """Auto-detect Arduino COM port"""
    try:
        import serial.tools.list_ports
        ports = serial.tools.list_ports.comports()
        
        for port in ports:
            if 'Arduino' in port.description or 'CH340' in port.description or 'USB' in port.description:
                logger.info(f"Found Arduino on {port.device}: {port.description}")
                return port.device
        
        # If no Arduino found, list available ports
        logger.warning("No Arduino detected. Available ports:")
        for port in ports:
            logger.warning(f"  - {port.device}: {port.description}")
        
        if ports:
            logger.info(f"Trying first available port: {ports[0].device}")
            return ports[0].device
        
    except Exception as e:
        logger.warning(f"Could not auto-detect port: {e}")
    
    return None


def main():
    """Main entry point"""
    # Get serial port from command line or auto-detect
    port = sys.argv[1] if len(sys.argv) > 1 else find_arduino_port()
    
    if not port:
        logger.error("No serial port specified and Arduino not found")
        logger.info("Usage: python arduino_serial_reader.py [COM_PORT]")
        logger.info("Example: python arduino_serial_reader.py COM3")
        sys.exit(1)
    
    # Check if Flask server is running
    try:
        response = requests.get(f"{FLASK_SERVER_URL.replace('/api/sensors', '')}/api/sensors/last", timeout=2)
        logger.info("✓ Flask server is running")
    except requests.exceptions.RequestException:
        logger.warning("⚠ Flask server not responding. Make sure to run: python server/receiver.py")
    
    # Start reading from Arduino
    reader = ArduinoSerialReader(port)
    reader.run()


if __name__ == "__main__":
    main()
