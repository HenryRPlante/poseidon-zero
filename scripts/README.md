Serial forwarder

This repo includes a small Python utility to read newline-separated sensor data from a serial port
(Arduino) and forward it to an HTTP endpoint.

Usage

1) Install requirements for the forwarder

```bash
python3 -m pip install -r scripts/requirements.txt
```

2) Run a receiving endpoint (optional, a simple Flask receiver is provided):

```bash
python3 server/receiver.py
```

3) Run the forwarder pointing at your serial device and the receiver URL:

```bash
python3 scripts/run_forwarder.sh
```

Optional (manual port override):

```bash
python3 scripts/serial_forward.py --port /dev/ttyACM0 --baud 9600 --url http://localhost:5000/api/sensors
```

Notes

- Supported serial line formats:
	- plain float (`7.21`) -> legacy pH-only payload
	- JSON object (`{"ph":7.2,"temperature":24.1,"tds":430}`)
	- JSON envelope (`{"success":true,"data":{...}}`)
	- key:value CSV (`ph:7.2,temperature:24.1,tds:430`)
- If `--port` is omitted, the forwarder auto-detects the Arduino serial port.
- The forwarder sends JSON to the URL and preserves any recognized sensor fields: `ph`, `temperature`, `tds`, `ec`, `turbidity`, `salinity`, `signalStrength`, `batteryLevel`.
- Add `--interval N` to limit forwards to at most one per N seconds.
