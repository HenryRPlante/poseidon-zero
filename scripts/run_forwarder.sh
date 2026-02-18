#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 SERIAL_PORT [BAUD] [URL]"
  echo "Example: $0 /dev/ttyACM0 9600 http://localhost:5000/ph"
  exit 1
fi

PORT="$1"
BAUD="${2:-9600}"
URL="${3:-http://localhost:5000/ph}"

python3 -m pip install -r scripts/requirements.txt
python3 scripts/serial_forward.py --port "$PORT" --baud "$BAUD" --url "$URL"
