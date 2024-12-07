from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..db.session import get_async_db
from ..db.models import Thread, Message, WebSocketToken
from ..core.security import verify_token
from ..core.websocket import manager, WebSocket, WebSocketDisconnect
from ..core.gemini_client import get_gemini_response
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import traceback


router = APIRouter()

class ThreadCreateRequest(BaseModel):
    title: str

@router.post("/threads")
async def create_thread(request: ThreadCreateRequest, user_id: int = Depends(verify_token), db: AsyncSession = Depends(get_async_db)):
    try:
        thread = Thread(user_id=user_id, title=request.title)
        db.add(thread)
        await db.commit()
        await db.refresh(thread)
        return thread
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/threads")
async def get_threads(user_id: int = Depends(verify_token), db: AsyncSession = Depends(get_async_db)):
    try:
        threads = await db.execute(select(Thread).filter(Thread.user_id == user_id))
        return threads.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/threads/{thread_id}/messages")
async def get_messages(
    thread_id: int,
    user_id: int = Depends(verify_token),
    db: AsyncSession = Depends(get_async_db)
):
    thread = await db.execute(select(Thread).filter(
        Thread.id == thread_id,
        Thread.user_id == user_id
    ))
    thread = thread.scalars().first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
        
    messages = await db.execute(select(Message).filter(Message.thread_id == thread_id))
    return messages.scalars().all()

@router.websocket("/ws/{ws_token}")
async def websocket_endpoint(websocket: WebSocket, ws_token: str, db: AsyncSession = Depends(get_async_db)):
    # Log connection attempt
    print(f"WebSocket connection attempt with token: {ws_token}")
    
    result = await db.execute(
        select(WebSocketToken).filter(
            WebSocketToken.token == ws_token,
            WebSocketToken.expires_at > datetime.utcnow()
        )
    )
    ws_token_entry = result.scalars().first()

    if not ws_token_entry:
        print("Invalid WebSocket token", ws_token, ws_token_entry.to_dict())
        await websocket.close(code=1008)  # Policy Violation
        return

    user_id = ws_token_entry.user_id

    # Optionally delete the token to prevent reuse
    await db.delete(ws_token_entry)
    await db.commit()

    await manager.connect(websocket, user_id)

    try:
        while True:
            data = await websocket.receive_json()
            
            print(data)
            
            if data.get("type") == "pong":
                continue
            
            # Validate thread ownership
            thread = await db.execute(select(Thread).filter(
                Thread.id == data["thread_id"],
                Thread.user_id == user_id
            ))
            thread = thread.scalars().first()
            
            if not thread:
                await websocket.send_json({
                    "type": "error",
                    "message": "Thread not found"
                })
                continue
            
            # Save user message
            message = Message(
                thread_id=data["thread_id"],
                content=data["content"],
                is_bot=False
            )
            db.add(message)
            await db.commit()
            
            await db.refresh(message)
            
            # Send acknowledgment
            await manager.broadcast_to_user({
                "type": "message",
                "thread_id": data["thread_id"],
                "message_id": message.id,
                "content": data["content"],
                "is_bot": False,
                "timestamp": datetime.utcnow().isoformat()
            }, user_id)
            
            # Get and save bot response
            try:
                bot_response = await get_gemini_response(data["content"])
                bot_message = Message(
                    thread_id=data["thread_id"],
                    content=bot_response,
                    is_bot=True
                )
                db.add(bot_message)
                await db.commit()

                await db.refresh(bot_message)
                
                await manager.broadcast_to_user({
                    "type": "message",
                    "thread_id": data["thread_id"],
                    "message_id": bot_message.id,
                    "content": bot_response,
                    "is_bot": True,
                    "timestamp": datetime.utcnow().isoformat()
                }, user_id)
            except Exception as e:
                await manager.broadcast_to_user({
                    "type": "error",
                    "message": "Failed to get bot response"
                }, user_id)
            
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)
        
    except Exception as e:
        print(e)
        print(traceback.format_exc())
        await websocket.close()
