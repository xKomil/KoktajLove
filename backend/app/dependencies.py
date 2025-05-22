from typing import Generator, Optional

from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import SessionLocal
from app.core.config import settings
from app.core import security
from app.models.user import User
from app.crud import crud_user
from app.schemas.token import TokenData

class UserAuth(BaseModel): # Prosty wrapper na użytkownika, aby go przekazać
    id: int
    username: str
    email: str

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

async def get_current_user(
    token: str = Depends(security.oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    print(f"--- DEBUG [get_current_user] --- Rozpoczynam walidację tokenu.")
    print(f"--- DEBUG [get_current_user] --- Otrzymany token (pierwsze 20 znaków): {token[:20]}...")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials (token issue)", # Bardziej szczegółowy komunikat
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"--- DEBUG [get_current_user] --- Próbuję zdekodować token używając security.decode_access_token.")
        print(f"--- DEBUG [get_current_user] --- Używany SECRET_KEY (pierwsze 5 znaków): {settings.SECRET_KEY[:5]}...")
        print(f"--- DEBUG [get_current_user] --- Używany ALGORITHM: {settings.ALGORITHM}")

        payload = security.decode_access_token(token)
        print(f"--- DEBUG [get_current_user] --- Zdekodowany payload: {payload}")

        if payload is None:
            print(f"--- DEBUG [get_current_user] --- BŁĄD: Payload jest None po dekodowaniu.")
            raise credentials_exception

        username_from_payload: Optional[str] = payload.get("sub")
        print(f"--- DEBUG [get_current_user] --- Username ('sub') z payloadu: {username_from_payload}")

        if username_from_payload is None:
            print(f"--- DEBUG [get_current_user] --- BŁĄD: 'sub' (username) jest None w payloadzie.")
            raise credentials_exception

        # Sprawdzenie schematu TokenData (zakładając, że go używasz)
        try:
            token_data = TokenData(username=username_from_payload)
            print(f"--- DEBUG [get_current_user] --- Utworzono TokenData: {token_data.model_dump_json()}") # Dla Pydantic v2
        except Exception as e_pydantic: # Złap błąd walidacji Pydantic
            print(f"--- DEBUG [get_current_user] --- BŁĄD walidacji Pydantic dla TokenData: {e_pydantic}")
            # Zamiast credentials_exception, rzućmy bardziej szczegółowy błąd, który da 422
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid token data structure: {e_pydantic}"
            )

    except JWTError as e_jwt: # Błąd z biblioteki JOSE (np. zły podpis, wygaśnięty)
        print(f"--- DEBUG [get_current_user] --- BŁĄD JWTError podczas dekodowania tokenu: {e_jwt}")
        raise credentials_exception
    except Exception as e_general: # Inne nieoczekiwane błędy podczas przetwarzania tokenu
        print(f"--- DEBUG [get_current_user] --- Inny błąd podczas przetwarzania tokenu: {e_general}")
        # Możesz chcieć rzucić 500 lub bardziej szczegółowy błąd
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing token: {e_general}"
        )

    print(f"--- DEBUG [get_current_user] --- Próbuję pobrać użytkownika z DB: {token_data.username}")
    user = crud_user.user.get_user_by_username(db, username=token_data.username)
    print(f"--- DEBUG [get_current_user] --- Wynik z DB dla użytkownika '{token_data.username}': {user}")

    if user is None:
        print(f"--- DEBUG [get_current_user] --- BŁĄD: Użytkownik '{token_data.username}' nie znaleziony w DB.")
        raise credentials_exception
    
    print(f"--- DEBUG [get_current_user] --- Pomyślnie zweryfikowano token i znaleziono użytkownika: {user.username}")
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    # Tutaj można dodać logikę sprawdzającą, czy użytkownik jest aktywny,
    # np. if not current_user.is_active: raise HTTPException(...)
    return current_user