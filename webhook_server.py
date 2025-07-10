from flask import Flask, request, jsonify
from datetime import datetime
import logging
import requests

app = Flask(__name__)

# Enable logging to file
logging.basicConfig(filename='webhook.log', level=logging.INFO)

# Remote base URL for forwarding
REMOTE_BASE_URL = "https://ruojp8phda.execute-api.us-east-1.amazonaws.com/prod/"

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    if not data:
        return jsonify({'error': 'Invalid JSON payload'}), 400

    # Log and print the received alert
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_message = f"[{timestamp}] TradingView Webhook Triggered: {data}"
    logging.info(log_message)
    print(log_message)

    # Forward to remote base URL
    try:
        remote_resp = requests.post(REMOTE_BASE_URL, json=data, timeout=10)
        remote_status = remote_resp.status_code
        remote_text = remote_resp.text
        logging.info(f"[{timestamp}] Forwarded to remote: {REMOTE_BASE_URL} | Status: {remote_status} | Response: {remote_text}")
    except Exception as e:
        logging.error(f"[{timestamp}] Error forwarding to remote: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to forward to remote', 'error': str(e)}), 500

    return jsonify({'status': 'success', 'message': 'Alert received and forwarded', 'remote_status': remote_status}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True, use_reloader=False) 