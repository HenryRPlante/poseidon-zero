#!/usr/bin/env python3
"""
Serial -> HTTP forwarder for Arduino pH readings
Reads newline-separated pH values from a serial port and POSTs JSON to a configured URL.
"""

import argparse
import time
import json
import requests
import serial
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')


def parse_args():
    p = argparse.ArgumentParser(description='Forward serial pH readings to an HTTP endpoint')
    p.add_argument('--port', '-p', required=True, help='Serial port (e.g. /dev/ttyACM0 or COM3)')
    p.add_argument('--baud', '-b', type=int, default=9600, help='Baud rate (default: 9600)')
    p.add_argument('--url', '-u', required=True, help='Target HTTP URL to POST readings (e.g. http://localhost:5000/ph)')
    p.add_argument('--interval', '-i', type=float, default=0.0, help='Minimum seconds between forwards (0 = send every reading)')
    p.add_argument('--timeout', type=float, default=5.0, help='HTTP request timeout in seconds')
    p.add_argument('--retries', type=int, default=3, help='Number of HTTP retry attempts on failure')
    p.add_argument('--ignore-malformed', action='store_true', help='Ignore lines that cannot be parsed as float')
    return p.parse_args()


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


def main():
    args = parse_args()

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
        buffer = ''
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

            # Try to parse a float from the line
            try:
                ph = float(line.split()[0])
            except Exception as e:
                logging.warning('Malformed line (not float): %s', line)
                if args.ignore_malformed:
                    continue
                else:
                    continue

            now = datetime.utcnow().isoformat() + 'Z'
            payload = {'ph': ph, 'timestamp': now}

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
