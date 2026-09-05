import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Kharridlo API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://kharridlo.vercel.app"

    # PostgreSQL Database Configuration
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/dhankriya"

    # Multi-Provider AI Credentials (Configuration foundation)
    GEMINI_API_KEY: str = ""
    GEMINI_API_KEY_2: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GROQ_API_KEY: str = ""
    GROQ_API_KEY_2: str = ""

    # Razorpay Test Mode API Credentials
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # Marketplace Integration Settings (Milestone 9)
    # Amazon Creators API (OAuth 2.0 Client ID & Secret)
    AMAZON_CREATORS_API_ENABLED: bool = False
    AMAZON_CREATORS_CLIENT_ID: str = ""
    AMAZON_CREATORS_CLIENT_SECRET: str = ""
    AMAZON_PARTNER_TAG: str = ""
    AMAZON_REGION: str = "eu-west-1"
    AMAZON_HOST: str = "creatorsapi.amazon"
    AMAZON_MARKETPLACE: str = "www.amazon.in"
    AMAZON_TOKEN_ENDPOINT: str = "https://api.amazon.co.uk/auth/o2/token"
    # Legacy PA-API fallback credentials (if provided)
    AMAZON_ACCESS_KEY: str = ""
    AMAZON_SECRET_KEY: str = ""

    FLIPKART_API_ENABLED: bool = False
    FLIPKART_AFFILIATE_ID: str = ""
    FLIPKART_AFFILIATE_TOKEN: str = ""
    FLIPKART_API_BASE_URL: str = "https://affiliate-api.flipkart.net/affiliate/1.0"

    # Marketplace Caching & Resilience
    MARKETPLACE_SEARCH_CACHE_TTL_SECONDS: int = 900  # 15 minutes
    MARKETPLACE_PRODUCT_CACHE_TTL_SECONDS: int = 1800  # 30 minutes
    MARKETPLACE_RATE_LIMIT_PER_MINUTE: int = 30

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

    @property
    def normalized_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        if url.startswith("postgresql://") and not url.startswith("postgresql+"):
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url


settings = Settings()
