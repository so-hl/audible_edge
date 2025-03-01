import websocket
import json
import collections
import time
from flask import Flask, request, render_template
import threading

app = Flask(__name__)

# Global configuration (updated dynamically via Flask UI)
SYMBOL = "ethusdt"
THRESHOLD = 0.02
TIME_WINDOW = 30
BINANCE_WS_URL = "wss://stream.binance.com:9443/ws"

# Store recent prices
price_history = collections.deque(maxlen=TIME_WINDOW)

# WebSocket connection
ws = None

def on_message(ws, message):
    global price_history
    try:
        data = json.loads(message)

        if data.get("e") == "trade":
            symbol = data.get("s", "").lower()
            price = float(data["p"])
            
            if symbol == SYMBOL:
                print(f"💰 Current Price: {price}")
                price_history.append(price)

                if len(price_history) >= TIME_WINDOW:
                    first_price = price_history[0]
                    price_change = ((price - first_price) / first_price) * 100
                    print(f"📊 Price Change: {price_change:.2f}%")

                    if abs(price_change) >= THRESHOLD:
                        alert(price_change)
    except Exception as e:
        print(f"❌ Error processing message: {e}")

def alert(change):
    print(f"🚨 ALERT: Price moved {change:.2f}% in {TIME_WINDOW}s")

def on_open(ws):
    print("✅ WebSocket connected")
    payload = {
        "method": "SUBSCRIBE",
        "params": [f"{SYMBOL}@trade"],
        "id": 1
    }
    ws.send(json.dumps(payload))
    print(f"📡 Sent subscription request: {payload}")

def on_error(ws, error):
    print(f"❌ WebSocket Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("❌ WebSocket closed. Reconnecting in 5 seconds...")
    time.sleep(5)
    start_websocket()

def start_websocket():
    global ws
    ws = websocket.WebSocketApp(
        BINANCE_WS_URL,
        on_message=on_message,
        on_open=on_open,
        on_error=on_error,
        on_close=on_close
    )
    ws.run_forever()

def run_websocket():
    while True:
        start_websocket()

# Start WebSocket in a separate thread
threading.Thread(target=run_websocket, daemon=True).start()

@app.route("/", methods=["GET", "POST"])
def index():
    global SYMBOL, THRESHOLD, TIME_WINDOW
    if request.method == "POST":
        SYMBOL = request.form.get("symbol", "ethusdt").lower()
        THRESHOLD = float(request.form.get("threshold", 0.02))
        TIME_WINDOW = int(request.form.get("time_window", 30))
        print(f"🔧 Updated Config: SYMBOL={SYMBOL}, THRESHOLD={THRESHOLD}, TIME_WINDOW={TIME_WINDOW}")
    return render_template("index.html", symbol=SYMBOL, threshold=THRESHOLD, time_window=TIME_WINDOW)

if __name__ == "__main__":
    app.run(debug=True)