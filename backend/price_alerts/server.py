from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ Allow WebSockets from ANY origin (Remove for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (temporary fix)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/binance_ws/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    print(f"🔗 WebSocket request for {symbol}")

    await websocket.accept()  # ✅ Ensure FastAPI accepts WebSockets

    try:
        while True:
            data = await websocket.receive_text()  # Keep connection alive
            print(f"📩 Received: {data}")
    except WebSocketDisconnect:
        print("❌ WebSocket disconnected")
