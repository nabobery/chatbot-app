from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./chatbot.db"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    APPLE_CLIENT_ID: str
    APPLE_CLIENT_SECRET: str
    GEMINI_API_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ACCESS_TOKEN_EXPIRE_SECONDS: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    REFRESH_TOKEN_EXPIRE_SECONDS: int = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    class Config:
        env_file = ".env"

settings = Settings()