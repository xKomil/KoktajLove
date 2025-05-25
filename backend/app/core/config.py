import secrets
from typing import Optional, Union, List

from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, EmailStr, field_validator, model_validator, ValidationInfo

class Settings(BaseSettings):
    PROJECT_NAME: str = "KoktajLOVE API"
    API_V1_STR: str = "/api/v1"

    # Baza danych
    DATABASE_URL: str = "sqlite:///./koktajlove.db"

    # JWT
    SECRET_KEY: str = "84ffb6af5c52f4c99ca2ca0778a86e5f888b1b3a83b66339791b9db1aac99c50"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Uvicorn
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # CORS
    BACKEND_CORS_ORIGINS: list[AnyHttpUrl] = ["http://localhost:3000"] # Frontend URL

    # Pierwszy superużytkownik (opcjonalnie, jeśli chcesz go tworzyć przy starcie)
    FIRST_SUPERUSER_EMAIL: Optional[EmailStr] = None
    FIRST_SUPERUSER_USERNAME: Optional[str] = None
    FIRST_SUPERUSER_PASSWORD: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True 

settings = Settings()