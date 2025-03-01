from fastapi import FastAPI, WebSocket
import json
import websockets

app = FastAPI()

# WebSocket price tracking
@app.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    binance_ws_url = f"wss://stream.binance.com:9443/ws/{symbol}@trade"
    
    async with websockets.connect(binance_ws_url) as binance_ws:
        await websocket.accept()
        while True:
            data = await binance_ws.recv()
            await websocket.send_text(data)
