#!/bin/bash
# Arduino to Ionic Bridge - Mac/Linux Setup
# Run this to start sending Arduino data to Ionic app

echo ""
echo "======================================================================"
echo "Arduino to Ionic Bridge - Mac/Linux"
echo "======================================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found!"
    echo "Please install Python 3:"
    echo "  Mac: brew install python3"
    echo "  Linux: sudo apt install python3 python3-pip"
    exit 1
fi

echo "Installing required packages..."
pip3 install -q pyserial requests

echo ""
echo "Starting Arduino reader..."
echo ""

python3 arduino_to_ionic.py
