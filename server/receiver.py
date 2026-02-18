from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')

# Allow cross-origin requests (permissive for quick testing)
CORS(app, resources={r"/*": {"origins": "*"}})

last_reading = None

@app.route('/ph', methods=['POST'])
def receive_ph():
    global last_reading
    data = request.get_json(force=True, silent=True)
    if not data or 'ph' not in data:
        return jsonify({'error': 'invalid payload, expected JSON with `ph`'}), 400
    last_reading = data
    app.logger.info('Received pH: %s', data)
    return jsonify({'status': 'ok'}), 200

@app.route('/ph/last', methods=['GET'])
def get_last():
    if last_reading is None:
        return jsonify({'status': 'no_data'}), 204
    return jsonify(last_reading), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
