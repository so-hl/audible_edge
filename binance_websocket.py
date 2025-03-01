import websocket
import json
import collections
import time
import threading
import subprocess
from queue import Queue

# Configurable Params
SYMBOL = "ethusdt"  # Binance requires lowercase
THRESHOLD = 0.02  # % change threshold for alerts
TIME_WINDOW = 30  # Seconds to track price changes

# WebSocket URL (Spot Market)
BINANCE_WS_URL = "wss://stream.binance.com:9443/ws"

# Store recent prices
price_history = collections.deque(maxlen=TIME_WINDOW)

# Load your sound file 
ALERT_SOUND = "sounds/beep.wav"  

def play_sound():
    try:
        subprocess.Popen(["ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet", ALERT_SOUND], 
                 stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, close_fds=True)

    except Exception as e:
        print(f"❌ Sound error: {e}")

def on_message(ws, message):
    global price_history
    try:
        data = json.loads(message)

        # Debug: Print full response
        print(f"🔄 Received: {data}")

        # Ensure it's a trade event
        if data.get("e") == "trade":
            symbol = data.get("s", "").lower()  # Ensure lowercase
            price = float(data["p"])  # Extract trade price
            
            # Only process if it's the correct symbol
            if symbol == SYMBOL:
                print(f"💰 Current Price: {price}")
                price_history.append(price)

                if len(price_history) >= TIME_WINDOW:
                    first_price = price_history[0]
                    price_change = ((price - first_price) / first_price) * 100
                    print(f"📊 Price Change: {price_change:.2f}%")

                    if abs(price_change) >= THRESHOLD:
                        alert(price_change)
            else:
                print(f"⚠️ Ignoring trade for different asset: {symbol}")

    except Exception as e:
        print(f"❌ Error processing message: {e}")

last_alert_time = 0  # Global variable

sound_queue = Queue()

def sound_worker():
    while True:
        sound_file = sound_queue.get()
        if sound_file:
            play_sound()
        sound_queue.task_done()

threading.Thread(target=sound_worker, daemon=True).start()

def alert(change):
    global last_alert_time
    current_time = time.time()

    if current_time - last_alert_time >= TIME_WINDOW:
        last_alert_time = current_time
        print(f"🚨 ALERT: Price moved {change:.2f}% in {TIME_WINDOW}s")
        threading.Thread(target=play_sound, daemon=True).start()

def on_open(ws):
    print("✅ WebSocket connected")
    payload = {
        "method": "SUBSCRIBE",
        "params": [f"{SYMBOL}@trade"],  # Lowercase symbol
        "id": 1
    }
    ws.send(json.dumps(payload))
    print(f"📡 Sent subscription request: {payload}")

def on_error(ws, error):
    print(f"❌ WebSocket Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("❌ WebSocket closed. Reconnecting in 5 seconds...")
    for i in range(5, 30, 5):  # Exponential backoff up to 30s
        time.sleep(i)
        try:
            start_websocket()
            return
        except Exception:
            print(f"⚠️ Reconnection attempt failed, retrying in {i} seconds...")


def start_websocket():
    ws = websocket.WebSocketApp(
        BINANCE_WS_URL,  # Ensure correct WebSocket URL
        on_message=on_message,
        on_open=on_open,
        on_error=on_error,
        on_close=on_close
    )
    ws.run_forever()

if __name__ == "__main__":
    start_websocket()
    