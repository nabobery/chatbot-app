from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict, Set
import json
import asyncio


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        self.ping_interval = 30  # seconds

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        print(f"User {user_id} connected.")
        # Start ping-pong
        asyncio.create_task(self._ping_client(websocket, user_id))

    async def disconnect(self, websocket: WebSocket, user_id: int):
        try:
            if user_id in self.active_connections:
                self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
                    print(f"User {user_id} disconnected.")
        except Exception as e:
            print(f"User {user_id} disconnected because of an error: {e}")

    async def _ping_client(self, websocket: WebSocket, user_id: int):
        try:
            while True:
                try:
                    await asyncio.sleep(self.ping_interval)
                    if websocket.client_state.CONNECTED:
                        await websocket.send_json({"type": "ping"})
                except WebSocketDisconnect:
                        break
        except Exception as e:
            print(f"User {user_id} disconnected because of an error: {e}")
        finally:
            await self.disconnect(websocket, user_id)

    async def broadcast_to_user(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                    print(f"Sent message: {message} to user {user_id}")
                except Exception:
                    dead_connections.add(connection)
            
            # Clean up dead connections
            for dead in dead_connections:
                await self.disconnect(dead, user_id)

manager = ConnectionManager()