Serial forwarder

This repo includes a small Python utility to read newline-separated pH values from a serial port
(Arduino) and forward them to an HTTP endpoint.

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
python3 scripts/serial_forward.py --port /dev/ttyACM0 --baud 9600 --url http://localhost:5000/ph
```

Notes

- The forwarder expects the Arduino to print one pH value per line (e.g. `7.21`). Your sketch already does this with `Serial.println(phValue, 2);`.
- You can change the destination URL to your app or server. The forwarder sends JSON: `{ "ph": 7.21, "timestamp": "..." }`.
- Add `--interval N` to limit forwards to at most one per N seconds.
