from typing import List
from fastapi import WebSocket

class ConnectionManager:
    """
    Keeps track of active WebSocket connections 
    and allows broadcasting messages to all of them.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        """Sends a message to all connected clients."""
        for connection in self.active_connections:
            await connection.send_text(message)

# Create a single instance to be used everywhere
manager = ConnectionManager()