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
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.decode_access_token(token)
        if payload is None:
            raise credentials_exception
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = crud_user.user.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    # Tutaj można dodać logikę sprawdzającą, czy użytkownik jest aktywny,
    # np. if not current_user.is_active: raise HTTPException(...)
    return current_user