from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse, JSONResponse
import asyncio
import json
import time
import requests
import socketio
from starlette.websockets import WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware  # Add this import

app = FastAPI()
sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
app.mount("/ws", socketio.ASGIApp(sio, socketio_path="/ws/socket.io"))

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500"],  # Allow the client origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

@app.post("/update")
async def update_trade(data: dict):
    await sio.emit('trade', data)
    return {"status": "received"}

@app.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket, symbol):
    print(f"🔧 Updated Symbol: {symbol}")
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await sio.emit('trade', json.loads(data))
    except WebSocketDisconnect:
        print("WebSocket disconnected")

@app.get("/trade/{symbol}")
async def get_trade(symbol: str):
    binance_url = f"https://api.binance.com/api/v3/trades?symbol={symbol.upper()}&limit=1"
    response = requests.get(binance_url)
    if response.status_code == 200:
        trades = response.json()
        if trades:
            latest_trade = trades[0]
            return {"p": float(latest_trade["price"]), "T": latest_trade["time"] / 1000}
    return {"p": 0, "T": time.time()}

@app.get("/")
async def get():
    return HTMLResponse("<h1>WebSocket Server Running</h1>")

@sio.on('subscribe')
async def handle_subscribe(sid, symbol):
    print(f"🔧 Subscribed to {symbol}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)