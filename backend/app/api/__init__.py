from fastapi import APIRouter
from .auth import router as auth_router
from .chat import router as chat_router
from .user import router as user_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(chat_router, prefix="/chat", tags=["chat"])
router.include_router(user_router, prefix="/user", tags=["user"])