#!/usr/bin/env python3
"""
Serial -> HTTP forwarder for Arduino sensor readings.
Reads newline-separated lines from a serial port and POSTs JSON to a configured URL.

Accepted serial line formats:
- Plain float (legacy): 7.21  -> {"ph": 7.21, "timestamp": "..."}
- JSON object: {"ph":7.2,"temperature":24.1,"tds":430}
- JSON envelope: {"success":true,"data":{...}}
- key:value CSV: ph:7.2,temperature:24.1,tds:430
"""

import argparse
import time
import json
import requests
import serial
import glob
import logging
from datetime import datetime
from serial.tools import list_ports

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')

SENSOR_KEYS = {
    'ph',
    'temperature',
    'tds',
    'ec',
    'turbidity',
    'salinity',
    'signalStrength',
    'batteryLevel'
}


def parse_args():
    p = argparse.ArgumentParser(description='Forward serial sensor readings to an HTTP endpoint')
    p.add_argument('--port', '-p', required=False, default=None, help='Serial port (auto-detected if omitted)')
    p.add_argument('--baud', '-b', type=int, default=9600, help='Baud rate (default: 9600)')
    p.add_argument('--url', '-u', required=True, help='Target HTTP URL to POST readings (e.g. http://localhost:5000/api/sensors)')
    p.add_argument('--interval', '-i', type=float, default=0.0, help='Minimum seconds between forwards (0 = send every reading)')
    p.add_argument('--timeout', type=float, default=5.0, help='HTTP request timeout in seconds')
    p.add_argument('--retries', type=int, default=3, help='Number of HTTP retry attempts on failure')
    p.add_argument('--ignore-malformed', action='store_true', help='Ignore lines that cannot be parsed as sensor data')
    return p.parse_args()


def _to_number(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except Exception:
            return None
    return None


def _extract_sensor_fields(candidate):
    payload = {}
    for key in SENSOR_KEYS:
        if key in candidate:
            number = _to_number(candidate.get(key))
            if number is not None:
                payload[key] = number
    return payload


def parse_line_to_payload(line):
    now = datetime.utcnow().isoformat() + 'Z'

    # 1) JSON object line
    try:
        parsed = json.loads(line)
        if isinstance(parsed, dict):
            source = parsed.get('data') if isinstance(parsed.get('data'), dict) else parsed
            payload = _extract_sensor_fields(source)
            if payload:
                payload['timestamp'] = source.get('timestamp', parsed.get('timestamp', now))
                return payload
    except Exception:
        pass

    # 2) key:value,key:value line
    if ':' in line:
        pieces = [piece.strip() for piece in line.split(',') if piece.strip()]
        candidate = {}
        for piece in pieces:
            if ':' not in piece:
                continue
            key, value = piece.split(':', 1)
            candidate[key.strip()] = value.strip()
        payload = _extract_sensor_fields(candidate)
        if payload:
            payload['timestamp'] = now
            return payload

    # 3) legacy plain pH float line
    try:
        ph = float(line.split()[0])
        return {'ph': ph, 'timestamp': now}
    except Exception:
        return None


def send_reading(url, payload, timeout, retries):
    for attempt in range(1, retries + 1):
        try:
            resp = requests.post(url, json=payload, timeout=timeout)
            resp.raise_for_status()
            logging.info('Forwarded: %s -> %s (status=%s)', payload, url, resp.status_code)
            return True
        except Exception as e:
            logging.warning('Attempt %d/%d failed: %s', attempt, retries, e)
            time.sleep(1)
    logging.error('Giving up forwarding: %s', payload)
    return False


def detect_serial_port():
    # Prefer pyserial-discovered USB serial ports first (cross-platform)
    ports = list(list_ports.comports())
    preferred = []
    fallback = []

    for port_info in ports:
        name = (port_info.device or '').lower()
        desc = (port_info.description or '').lower()
        hwid = (port_info.hwid or '').lower()

        score = 0
        if 'arduino' in desc or 'arduino' in hwid:
            score += 3
        if 'ttyacm' in name or 'usbmodem' in name:
            score += 2
        if 'ttyusb' in name or 'usbserial' in name or name.startswith('com'):
            score += 1

        if score >= 2:
            preferred.append(port_info.device)
        else:
            fallback.append(port_info.device)

    if preferred:
        return preferred[0]
    if fallback:
        return fallback[0]

    # Fallback glob scan for Linux/macOS when metadata is sparse
    candidates = []
    patterns = [
        '/dev/ttyACM*',
        '/dev/ttyUSB*',
        '/dev/cu.usbmodem*',
        '/dev/cu.usbserial*'
    ]
    for pattern in patterns:
        candidates.extend(sorted(glob.glob(pattern)))

    return candidates[0] if candidates else None


def main():
    args = parse_args()

    if not args.port:
        detected = detect_serial_port()
        if not detected:
            logging.error('No serial device detected. Plug in your Arduino and rerun.')
            return
        args.port = detected
        logging.info('Auto-detected serial port: %s', args.port)

    # Keep trying to open the serial port until a device is connected.
    ser = None
    while ser is None:
        try:
            ser = serial.Serial(args.port, args.baud, timeout=1)
        except Exception as e:
            logging.info('Waiting for serial device on %s... (%s)', args.port, e)
            time.sleep(2)

    logging.info('Listening on %s @ %d baud, forwarding to %s', args.port, args.baud, args.url)

    last_sent = 0.0
    try:
        while True:
            try:
                raw = ser.readline()
            except Exception as e:
                logging.warning('Serial read error: %s — attempting reconnect', e)
                try:
                    ser.close()
                except Exception:
                    pass
                ser = None
                # Reconnect loop
                while ser is None:
                    try:
                        ser = serial.Serial(args.port, args.baud, timeout=1)
                        logging.info('Reconnected to %s', args.port)
                    except Exception as e:
                        logging.info('Reconnect failed: %s', e)
                        time.sleep(2)
                continue

            if not raw:
                continue

            try:
                line = raw.decode('utf-8', errors='ignore').strip()
            except Exception:
                line = raw.decode('latin1', errors='ignore').strip()

            if not line:
                continue

            logging.debug('RX: %s', line)

            payload = parse_line_to_payload(line)
            if payload is None:
                logging.warning('Malformed line (not sensor data): %s', line)
                if args.ignore_malformed:
                    continue
                continue

            # Throttle forwards if requested
            if args.interval > 0 and (time.time() - last_sent) < args.interval:
                logging.debug('Throttled, skipping send')
                continue

            success = send_reading(args.url, payload, args.timeout, args.retries)
            if success:
                last_sent = time.time()

    except KeyboardInterrupt:
        logging.info('Interrupted by user')
    finally:
        try:
            ser.close()
        except Exception:
            pass


if __name__ == '__main__':
    main()
