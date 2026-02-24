#!/bin/bash
# Poseidon Zero - Full System Startup Script
# Starts Flask server and Arduino serial reader

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"

echo "=========================================="
echo "Poseidon Zero - System Startup"
echo "=========================================="
echo ""

# Check if virtual environment exists
if [ ! -d "$ROOT_DIR/.venv" ]; then
    echo "⚠ Virtual environment not found at $ROOT_DIR/.venv"
    echo "Create it with: python -m venv .venv"
    exit 1
fi

# Activate virtual environment
echo "[1/3] Activating Python environment..."
source "$ROOT_DIR/.venv/bin/activate"

# Install requirements
echo "[2/3] Installing dependencies..."
pip install -q -r "$SERVER_DIR/requirements.txt"

# Start Flask server in background
echo "[3/3] Starting services..."
echo ""
echo "Starting Flask server on http://localhost:5000..."
cd "$SERVER_DIR"
python receiver.py &
FLASK_PID=$!

# Wait for Flask to start
sleep 2

# Start Arduino serial reader
echo "Starting Arduino serial reader..."
cd "$ROOT_DIR/scripts"
python arduino_serial_reader.py

# Clean up on exit
trap "kill $FLASK_PID 2>/dev/null || true" EXIT
