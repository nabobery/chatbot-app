from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum, Boolean
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import enum

Base = declarative_base()

class AuthProvider(enum.Enum):
    GOOGLE = "google"
    APPLE = "apple"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    name = Column(String)
    image_url = Column(String)
    email = Column(String, unique=True, index=True)
    auth_provider = Column(Enum(AuthProvider))
    provider_user_id = Column(String)  # ID from OAuth provider
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    threads = relationship("Thread", back_populates="user")

class Thread(Base):
    __tablename__ = "threads"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="threads")
    messages = relationship("Message", back_populates="thread")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True)
    thread_id = Column(Integer, ForeignKey("threads.id"))
    content = Column(Text)
    is_bot = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    thread = relationship("Thread", back_populates="messages")

class WebSocketToken(Base):
    __tablename__ = 'web_socket_tokens'
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User")
    
    def to_dict(self):
        return {
            "id": self.id,
            "token": self.token,
            "user_id": self.user_id,
            "expires_at": self.expires_at,
        }