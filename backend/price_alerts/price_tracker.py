import websocket
import json
import collections
import time
import requests
from flask import Flask, render_template
import threading

app = Flask(__name__, template_folder="../frontend/templates", static_folder="../frontend/static")

# FastAPI Server URL (Change to match your host if running separately)
FASTAPI_WS_URL = "ws://127.0.0.1:8000/ws/"
FASTAPI_API_URL = "http://127.0.0.1:8000"

# Global configuration
SYMBOL = "ethusdt"
THRESHOLD = 0.02
TIME_WINDOW = 30
price_history = collections.deque(maxlen=TIME_WINDOW)

# Function to update symbol
def update_symbol(new_symbol):
    global SYMBOL
    SYMBOL = new_symbol.lower()
    requests.post(f"{FASTAPI_API_URL}/update_symbol", json={"symbol": SYMBOL})
    print(f"🔧 Updated Symbol: {SYMBOL}")

# WebSocket to receive live price updates from FastAPI
def connect_to_fastapi_ws():
    ws = websocket.WebSocketApp(
        f"{FASTAPI_WS_URL}{SYMBOL}",
        on_message=on_ws_message,
        on_error=on_ws_error,
        on_close=on_ws_close
    )
    ws.run_forever()

# Process WebSocket messages
def on_ws_message(ws, message):
    global price_history
    try:
        data = json.loads(message)
        price = float(data["p"])
        price_history.append(price)
        
        # Calculate price change
        if len(price_history) >= TIME_WINDOW:
            first_price = price_history[0]
            price_change = ((price - first_price) / first_price) * 100
            print(f"📊 Price Change: {price_change:.2f}%")
            
            # Trigger alert if threshold exceeded
            if abs(price_change) >= THRESHOLD:
                print(f"🚨 ALERT: Price moved {price_change:.2f}% in {TIME_WINDOW}s")

    except Exception as e:
        print(f"❌ Error processing message: {e}")

# Handle WebSocket errors
def on_ws_error(ws, error):
    print(f"❌ WebSocket Error: {error}")

# Handle WebSocket close
def on_ws_close(ws, close_status_code, close_msg):
    print("❌ WebSocket closed. Reconnecting in 5 seconds...")
    time.sleep(5)
    connect_to_fastapi_ws()

# Start WebSocket in a separate thread
threading.Thread(target=connect_to_fastapi_ws, daemon=True).start()

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
