from fastapi import FastAPI, WebSocket
import json
import websockets

app = FastAPI()

# Default values
SYMBOL = "ethusdt"
BINANCE_WS_URL = lambda symbol: f"wss://stream.binance.com:9443/ws/{symbol}@trade"

async def binance_ws(websocket: WebSocket, symbol: str):
    async with websockets.connect(BINANCE_WS_URL(symbol)) as binance_ws:
        await websocket.accept()
        while True:
            data = await binance_ws.recv()
            await websocket.send_text(data)

@app.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await binance_ws(websocket, symbol)

@app.post("/update_symbol")
async def update_symbol_endpoint(symbol: str):
    global SYMBOL
    SYMBOL = symbol.lower()
    return {"message": "Symbol updated successfully", "new_symbol": SYMBOL}
