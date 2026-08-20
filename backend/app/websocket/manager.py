import datetime
import json
from typing import List
from fastapi import WebSocket

class ConnectionManager:
    """
    Manages active WebSocket connections and broadcasts structured JSON events.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception:
            pass

    async def broadcast(self, event_type: str, payload: dict):
        """
        Broadcasts a structured JSON event to all connected clients.
        """
        message = {
            "type": event_type,
            "payload": payload,
            "timestamp": datetime.datetime.now(datetime.UTC).isoformat().replace("+00:00", "Z")
        }
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()
