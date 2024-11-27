from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, Session
from ..core.config import settings

# Create synchronous engine and session factory
sync_engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# Create asynchronous engine and session factory
async_engine = create_async_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
AsyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, class_=AsyncSession, bind=async_engine)

# Synchronous get_db function
def get_db():
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Asynchronous get_db function
async def get_async_db():
    async with AsyncSessionLocal() as db:
        yield db

# Initialize database tables if they do not exist
def init_db():
    with sync_engine.connect() as connection:
        with open("script.sql") as f:
            sql_commands = f.read()
        for command in sql_commands.split(";"):
            if command.strip():
                connection.execute(text(command))
        connection.commit()

async def init_db_async():
    print("Initializing database")
    async with async_engine.connect() as connection:
        with open("script.sql") as f:
            sql_commands = f.read()
        for command in sql_commands.split(";"):
            if command.strip():
                await connection.execute(text(command))
        await connection.commit()

# Call init_db to initialize tables