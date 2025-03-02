from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import websockets

app = FastAPI()

# CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (change this in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dictionary to track active WebSocket clients per symbol
active_connections = {}

# Dictionary to maintain Binance WebSocket tasks per symbol
binance_tasks = {}

async def binance_ws(symbol: str):
    """Continuously fetches live trade data from Binance and distributes it to all clients."""
    url = f"wss://stream.binance.com:9443/ws/{symbol.lower()}@trade"
    
    try:
        async with websockets.connect(url) as ws:
            print(f"🔵 Started Binance WebSocket for {symbol}")
            
            while symbol in active_connections and active_connections[symbol]:
                data = await ws.recv()
                trade = json.loads(data)
                price = float(trade["p"])
                trade_time = trade["T"] / 1000  # Convert milliseconds to seconds

                # Send trade data to all connected clients
                for client in active_connections[symbol]:
                    try:
                        await client.send_json({"symbol": symbol, "price": price, "time": trade_time})
                    except Exception as e:
                        print(f"⚠️ Error sending data to client: {e}")

    except Exception as e:
        print(f"❌ Binance WebSocket error for {symbol}: {e}")

    finally:
        # Cleanup if all clients disconnected
        if symbol in binance_tasks:
            del binance_tasks[symbol]
        print(f"🛑 Stopped Binance WebSocket for {symbol}")

@app.websocket("/ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    """Handles client WebSocket connection for a trading pair."""
    await websocket.accept()
    
    if symbol not in active_connections:
        active_connections[symbol] = set()

    active_connections[symbol].add(websocket)

    # Start Binance WebSocket only if not already running
    if symbol not in binance_tasks:
        binance_tasks[symbol] = asyncio.create_task(binance_ws(symbol))

    try:
        while True:
            await websocket.receive_text()  # Keep connection open
    except WebSocketDisconnect:
        print(f"❌ Client disconnected from {symbol}")

        active_connections[symbol].remove(websocket)

        if not active_connections[symbol]:  # If no clients left, stop Binance WebSocket
            del active_connections[symbol]
            binance_tasks[symbol].cancel()  # Stop fetching data
            print(f"🔌 Closed connection for {symbol}")

@app.get("/")
async def root():
    return {"message": "WebSocket Binance Server Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
