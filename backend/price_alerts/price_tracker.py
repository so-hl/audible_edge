import websocket
import json
import collections
import time
import requests
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
import threading
import os
import random

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "../../frontend/templates")
STATIC_DIR = os.path.join(BASE_DIR, "../../frontend/static")

reconnect_attempts=0

app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC_DIR)
socketio = SocketIO(app, cors_allowed_origins="*")

FASTAPI_WS_URL = "ws://127.0.0.1:8000/ws/"
FASTAPI_API_URL = "http://127.0.0.1:8000"

# Default values
SYMBOL = "ethusdt"
THRESHOLD = 0.02
TIME_WINDOW = 30
price_history = collections.deque(maxlen=TIME_WINDOW)

def update_symbol(new_symbol):
    global SYMBOL
    SYMBOL = new_symbol.lower()
    requests.post(f"{FASTAPI_API_URL}/update_symbol", json={"symbol": SYMBOL})
    print(f"🔧 Updated Symbol: {SYMBOL}")

def connect_to_fastapi_ws():
    global SYMBOL
    ws = websocket.WebSocketApp(
        f"{FASTAPI_WS_URL}{SYMBOL}",
        on_message=on_ws_message,
        on_error=on_ws_error,
        on_close=on_ws_close
    )
    ws.run_forever()

def on_ws_message(ws, message):
    global price_history, THRESHOLD, TIME_WINDOW
    try:
        data = json.loads(message)
        price = float(data["p"])
        price_history.append(price)

        if len(price_history) >= TIME_WINDOW:
            first_price = price_history[0]
            price_change = ((price - first_price) / first_price) * 100
            print(f"📊 Price Change: {price_change:.2f}%")

            if abs(price_change) >= THRESHOLD:
                print(f"🚨 ALERT: Price moved {price_change:.2f}% in {TIME_WINDOW}s")
                socketio.emit('price_alert', {'price_change': price_change})
    
    except Exception as e:
        print(f"❌ Error processing message: {e}")

def on_ws_error(ws, error):
    print(f"❌ WebSocket Error: {error}")

def on_ws_close(ws, close_status_code, close_msg):
    global reconnect_attempts
    delay = min(2 ** reconnect_attempts + random.uniform(0, 1), 60)  # Cap at 60 seconds
    print(f"❌ WebSocket closed. Reconnecting in {delay:.2f} seconds...")
    time.sleep(delay)
    reconnect_attempts += 1
    connect_to_fastapi_ws()

# Route for frontend
@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

# API to update symbol, threshold, and time window dynamically
@app.route("/update_settings", methods=["POST"])
def update_settings():
    global SYMBOL, THRESHOLD, TIME_WINDOW, price_history

    data = request.get_json()
    SYMBOL = data.get("symbol", SYMBOL)
    THRESHOLD = float(data.get("threshold", THRESHOLD))
    TIME_WINDOW = int(data.get("time_window", TIME_WINDOW))
    price_history = collections.deque(maxlen=TIME_WINDOW)  # Reset history

    print(f"🔄 Updated settings - Symbol: {SYMBOL}, Threshold: {THRESHOLD}, Time Window: {TIME_WINDOW}")

    # Restart WebSocket connection with new symbol
    threading.Thread(target=connect_to_fastapi_ws, daemon=True).start()

    return jsonify({"message": "Settings updated", "symbol": SYMBOL, "threshold": THRESHOLD, "time_window": TIME_WINDOW})

if __name__ == "__main__":
    # Start WebSocket connection in a daemon thread
    ws_thread = threading.Thread(target=connect_to_fastapi_ws, daemon=True)
    ws_thread.start()

    try:
        socketio.run(app, host="0.0.0.0", port=5050, debug=True)
    except KeyboardInterrupt:
        print("\n🛑 Server shutting down.")