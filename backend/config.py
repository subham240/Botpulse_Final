import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "BotPulse AI Security Engine"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = Field(default="b9f71c4820d8e847b2c58971fce81a8b302c46a819b12e3e528b17b6d194c7a2", validation_alias="BOTPULSE_SECRET_KEY", min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DECISION_TOKEN_EXPIRE_SECONDS: int = 3600    # 1 hour
    
    # Database
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = "botpulse"
    DATA_DIR: str = os.getenv("DATA_DIR", "/tmp" if os.environ.get("VERCEL") else os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"))
    
    # Model storage path
    MODELS_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    
    # CORS allowed origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "https://elvara-fashion.vercel.app",
        "*"
    ]
    
    # Default registered site for Elvara Fashion integration
    DEFAULT_SITE_ID: str = "site_alvera_001"
    DEFAULT_SITE_KEY: str = "bp_pub_alvera_live_7c4f19e"
    DEFAULT_SITE_NAME: str = "ÉLVARA Fashion"
    DEFAULT_SITE_DOMAIN: str = "elvara-fashion.vercel.app"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
