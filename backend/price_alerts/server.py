from fastapi import FastAPI, WebSocket
import json
import websockets

app = FastAPI()

# WebSocket for streaming Binance data
@app.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    binance_ws_url = f"wss://stream.binance.com:9443/ws/{symbol}@trade"
    
    await websocket.accept()
    
    async with websockets.connect(binance_ws_url) as binance_ws:
        while True:
            try:
                data = await binance_ws.recv()
                trade = json.loads(data)

                # Send only necessary price data to frontend
                filtered_data = {"p": trade["p"]}
                await websocket.send_text(json.dumps(filtered_data))

            except Exception as e:
                print(f"WebSocket error: {e}")
                break
