from fastapi import FastAPI, WebSocket
import asyncio
import json
import websockets

app = FastAPI()

BINANCE_WS_URL = "wss://stream.binance.com:9443/ws/ethusdt@trade"

async def binance_ws(websocket: WebSocket):
    async with websockets.connect(BINANCE_WS_URL) as binance_ws:
        await websocket.accept()
        while True:
            data = await binance_ws.recv()
            await websocket.send_text(data)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await binance_ws(websocket)
