import secrets
from typing import Optional

from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, EmailStr, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "KoktajLOVE API"
    API_V1_STR: str = "/api/v1"

    # Baza danych
    DATABASE_URL: str = "sqlite:///./koktajlove.db"

    # JWT
    SECRET_KEY: str = "twoj_super_tajny_klucz_jwt_min_32_znaki_domyslny" # Powinien być nadpisany przez .env
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

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str] | str:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        raise ValueError(v)

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True

settings = Settings()