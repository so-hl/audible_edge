from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import asyncio
import json
import websockets
from starlette.websockets import WebSocketDisconnect
import socketio
import os

app = FastAPI()
sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
app.mount("/ws", socketio.ASGIApp(sio, socketio_path="/ws/socket.io"))

# Load tickers from JSON file
with open('../voice_trader/tickers.json', 'r') as f:
    VALID_SYMBOLS = set(json.load(f))
print(f"Loaded VALID_SYMBOLS: {VALID_SYMBOLS}")  # Debug log

# Default values
SYMBOL = "ethbtc"
BINANCE_WS_URL = f"wss://stream.binance.com:9443/ws/{SYMBOL}@trade"

async def binance_ws():
    try:
        async with websockets.connect(BINANCE_WS_URL) as ws:
            while True:
                data = await ws.recv()
                print(f"Received Binance data: {data}")
                await sio.emit('trade', json.loads(data))
    except websockets.ConnectionClosed:
        print("Binance WebSocket connection closed")
    except Exception as e:
        print(f"Binance WebSocket error: {e}")

@app.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket, symbol):
    global SYMBOL, BINANCE_WS_URL
    symbol = symbol.lower()
    if symbol not in VALID_SYMBOLS:
        print(f"Invalid symbol requested: {symbol}")
        await websocket.close(code=1008, reason="Invalid trading pair")
        return
    SYMBOL = symbol
    BINANCE_WS_URL = f"wss://stream.binance.com:9443/ws/{SYMBOL}@trade"
    print(f"🔧 Updated WebSocket URL: {BINANCE_WS_URL}")
    await websocket.accept()
    await sio.emit('connect', {'message': 'Connected to WebSocket'})
    try:
        asyncio.create_task(binance_ws())
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        print("WebSocket disconnected")

@app.get("/")
async def get():
    return HTMLResponse("<h1>WebSocket Server Running</h1>")

@sio.on('subscribe')
async def handle_subscribe(sid, symbol):
    global SYMBOL, BINANCE_WS_URL
    symbol = symbol.lower()
    if symbol not in VALID_SYMBOLS:
        print(f"Invalid subscription attempt for: {symbol}")
        await sio.emit('error', {'message': 'Invalid trading pair'}, room=sid)
        return
    SYMBOL = symbol
    BINANCE_WS_URL = f"wss://stream.binance.com:9443/ws/{SYMBOL}@trade"
    print(f"🔧 Subscribed to {SYMBOL}")
    asyncio.create_task(binance_ws())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)