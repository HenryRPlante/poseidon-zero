from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')

# Allow cross-origin requests (permissive for quick testing)
CORS(app, resources={r"/*": {"origins": "*"}})

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

last_reading = None


def normalize_payload(data):
    if not isinstance(data, dict):
        return None

    source = data.get('data') if isinstance(data.get('data'), dict) else data
    normalized = {}

    for key in SENSOR_KEYS:
        if key in source:
            try:
                normalized[key] = float(source[key])
            except Exception:
                pass

    if not normalized:
        return None

    normalized['timestamp'] = source.get('timestamp', data.get('timestamp', datetime.utcnow().isoformat() + 'Z'))
    return normalized


def merge_reading(new_data):
    global last_reading
    if last_reading is None:
        last_reading = new_data
        return

    merged = dict(last_reading)
    merged.update(new_data)
    last_reading = merged


@app.route('/api/sensors', methods=['POST'])
def receive_sensors():
    data = request.get_json(force=True, silent=True)
    normalized = normalize_payload(data)
    if not normalized:
        return jsonify({'error': 'invalid payload, expected JSON with at least one sensor field'}), 400

    merge_reading(normalized)
    app.logger.info('Received sensors: %s', normalized)
    return jsonify({'status': 'ok'}), 200


@app.route('/api/sensors/last', methods=['GET'])
def get_last_sensors():
    if last_reading is None:
        return jsonify({'status': 'no_data'}), 204
    return jsonify({'success': True, 'data': last_reading, 'timestamp': last_reading.get('timestamp')}), 200

@app.route('/ph', methods=['POST'])
def receive_ph():
    data = request.get_json(force=True, silent=True)
    normalized = normalize_payload(data)
    if not normalized or 'ph' not in normalized:
        return jsonify({'error': 'invalid payload, expected JSON with `ph`'}), 400
    merge_reading(normalized)
    app.logger.info('Received pH: %s', normalized)
    return jsonify({'status': 'ok'}), 200

@app.route('/ph/last', methods=['GET'])
def get_last():
    if last_reading is None:
        return jsonify({'status': 'no_data'}), 204
    return jsonify(last_reading), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
