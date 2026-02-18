#!/usr/bin/env bash
set -e

python3 -m pip install -r server/requirements.txt
python3 server/receiver.py
