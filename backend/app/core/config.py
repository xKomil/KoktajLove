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

    # @field_validator("BACKEND_CORS_ORIGINS", mode='before')
    # @classmethod
    # def assemble_cors_origins(cls, v: Any) -> List[str] | List[AnyHttpUrl]:
    #     if isinstance(v, str):
    #         # Jeśli string nie jest listą JSON, np. "http://localhost:3000,http://127.0.0.1:3000"
    #         if not v.startswith("[") and "," in v:
    #             return [item.strip() for item in v.split(",")]
    #         # Jeśli string jest pojedynczym URL-em
    #         elif not v.startswith("["):
    #              return [v.strip()]
    #     # Jeśli v jest już listą (np. z domyślnej wartości lub poprawnie sparsowanego .env)
    #     # lub jeśli .env zawierał string w formacie JSON listy, BaseSettings go sparsuje
    #     if isinstance(v, list):
    #         return v
    #     # Dla pewności można dodać obsługę stringa w formacie JSON listy
    #     if isinstance(v, str) and v.startswith("[") and v.endswith("]"):
    #         try:
    #             import json
    #             return json.loads(v)
    #         except json.JSONDecodeError:
    #             raise ValueError("BACKEND_CORS_ORIGINS string is not a valid JSON list")
    #     raise ValueError("BACKEND_CORS_ORIGINS must be a list of URLs or a comma-separated string of URLs")

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True 

settings = Settings()