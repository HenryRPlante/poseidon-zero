#!/usr/bin/env bash
set -e

PORT="${1:-}"
BAUD="${2:-9600}"
URL="${3:-http://localhost:5000/api/sensors}"

python3 -m pip install -r scripts/requirements.txt
if [ -n "$PORT" ]; then
  python3 scripts/serial_forward.py --port "$PORT" --baud "$BAUD" --url "$URL"
else
  python3 scripts/serial_forward.py --baud "$BAUD" --url "$URL"
fi
