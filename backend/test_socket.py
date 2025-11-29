import asyncio
import websockets

async def test_connection():
    uri = "ws://127.0.0.1:8000/ws"
    print(f"🔌 Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected! Waiting for messages...")
            print("(Go upload a file in the Swagger UI now!)")
            
            while True:
                message = await websocket.recv()
                print(f"📩 RECEIVED MESSAGE: {message}")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())