import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "DhanKriya API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # PostgreSQL Database Configuration
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/dhankriya"

    # Multi-Provider AI Credentials (Configuration foundation)
    GEMINI_API_KEY: str = ""
    GEMINI_API_KEY_2: str = ""
    GROQ_API_KEY: str = ""
    GROQ_API_KEY_2: str = ""

    # Razorpay Test Mode API Credentials
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # Future Infrastructure Placeholders
    REDIS_URL: str = ""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
