# app/api/user.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..db.session import get_async_db
from ..db.models import User, Thread
from ..core.security import verify_token
from pydantic import BaseModel
from sqlalchemy import select, func

router = APIRouter()

class UserResponse(BaseModel):
    id: int
    email: str
    auth_provider: str
    threads_count: int

    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    email: str
    auth_provider: str
    provider_user_id: str

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_async_db)
):
    try:
        print(user_id)
        user = await db.execute(select(User).filter(User.id == user_id))
        user = user.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get threads count
        threads_count = await db.execute(select(func.count(Thread.id)).filter(Thread.user_id == user_id))

        if threads_count:
            threads_count = threads_count.scalar()
        else:
            threads_count = 0
        
        return {
            "id": user.id,
            "email": user.email,
            "auth_provider": user.auth_provider.value,
            "threads_count": threads_count
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @router.get("/me/threads")
# async def get_user_threads(
#     user_id: int = Depends(verify_token),
#     db: Session = Depends(get_async_db)
# ):
#     threads = await db.execute(select(Thread).filter(Thread.user_id == user_id))
#     return threads.scalars().all()

@router.delete("/me")
async def delete_account(
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_async_db)
):
    try:
        user = await db.execute(select(User).filter(User.id == user_id))
        user = user.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        await db.delete(user)
        await db.commit()
        return {"message": "Account deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))