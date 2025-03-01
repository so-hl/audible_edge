from fastapi import FastAPI, WebSocket
import asyncio
import json
import websockets

app = FastAPI()

# Default values (to be updated dynamically)
SYMBOL = "ethusdt"
BINANCE_WS_URL = f"wss://stream.binance.com:9443/ws/{SYMBOL}@trade"

def update_symbol(new_symbol):
    global SYMBOL, BINANCE_WS_URL
    SYMBOL = new_symbol.lower()
    BINANCE_WS_URL = f"wss://stream.binance.com:9443/ws/{SYMBOL}@trade"
    print(f"🔧 Updated WebSocket URL: {BINANCE_WS_URL}")

async def binance_ws(websocket: WebSocket):
    async with websockets.connect(BINANCE_WS_URL) as binance_ws:
        await websocket.accept()
        while True:
            data = await binance_ws.recv()
            await websocket.send_text(data)

@app.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    update_symbol(symbol)
    await binance_ws(websocket)

@app.post("/update_symbol")
async def update_symbol_endpoint(symbol: str):
    update_symbol(symbol)
    return {"message": "Symbol updated successfully", "new_symbol": SYMBOL}