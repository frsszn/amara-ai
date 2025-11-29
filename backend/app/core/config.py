from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))


class Settings(BaseSettings):
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Amara AI"

    # Security
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database - Cloud SQL PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    # Cloud SQL instance connection name (project:region:instance)
    CLOUD_SQL_CONNECTION_NAME: str = os.getenv("CLOUD_SQL_CONNECTION_NAME", "")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASS: str = os.getenv("DB_PASS", "")
    DB_NAME: str = os.getenv("DB_NAME", "amara")

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
