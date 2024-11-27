from fastapi import FastAPI
import uvicorn
from app.api import router
from app.db.session import init_db_async
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Chatbot API",
    description="API for Chatbot",
    version="0.1.0"
)
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_async()
    yield
    # Add any cleanup code here if necessary

app.router.lifespan_context = lifespan

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")