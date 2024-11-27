from fastapi import APIRouter, Depends, HTTPException, Response, Request
from google.oauth2 import id_token
from google.auth.transport import requests
from ..core.config import settings
from ..core.security import create_access_token, create_refresh_token, verify_token
from ..db.session import get_async_db
from ..db.models import User, AuthProvider
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from jose import JWTError, jwt
from secrets import token_urlsafe

router = APIRouter()

class AuthRequest(BaseModel):
    token: str

@router.post("/google")
async def google_auth(request: AuthRequest,response: Response, db: AsyncSession = Depends(get_async_db)):
    try:
        idinfo = id_token.verify_oauth2_token(
            request.token, requests.Request(), settings.GOOGLE_CLIENT_ID
        )
        
        email = idinfo['email']
        provider_user_id = idinfo['sub']
        
        # Check if user exists
        user = await db.execute(
            select(User).filter(
                User.auth_provider == AuthProvider.GOOGLE,
                User.provider_user_id == provider_user_id
            )
        )
        user = user.scalars().first()
        
        if not user:
            user = User(
                name=idinfo.get('name'),
                image_url=idinfo.get('picture'),
                email=email,
                auth_provider=AuthProvider.GOOGLE,
                provider_user_id=provider_user_id
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        # Set tokens as HTTP-only cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=settings.REFRESH_TOKEN_EXPIRE_SECONDS
        )

        return {"user": user}
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    try:
        payload = jwt.decode(refresh_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Generate new access token
        access_token = create_access_token({"sub": str(user_id)})

        # Set new access token cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS
        )
        return {"detail": "Access token refreshed"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/logout")
async def logout(response: Response):
    try:
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return {"detail": "Logged out"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

ws_tokens = {}

@router.post("/ws-token")
async def generate_ws_token(request: Request, user_id: int = Depends(verify_token)):
    try:
        ws_token = token_urlsafe(16)
        ws_tokens[ws_token] = user_id
        return {"ws_token": ws_token}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))