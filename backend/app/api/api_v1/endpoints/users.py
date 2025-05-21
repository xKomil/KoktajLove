from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[schemas.User])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    # current_user: models.User = Depends(get_current_active_user) # Odkomentuj, jeśli tylko admin może listować użytkowników
):
    """
    Retrieve users.
    """
    # if not crud.user.is_superuser(current_user): # Przykład sprawdzania uprawnień
    #     raise HTTPException(status_code=403, detail="Not enough permissions")
    users = crud.user.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=schemas.User)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    # current_user: models.User = Depends(get_current_active_user) # Opcjonalnie, jeśli potrzebna autentykacja
):
    """
    Get user by ID.
    """
    db_user = crud.user.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.put("/me", response_model=schemas.User)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Update own user.
    """
    # Sprawdzenie, czy nowy email lub username nie są już zajęte (jeśli są zmieniane)
    if user_in.email:
        existing_user = crud.user.get_user_by_email(db, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already registered by another user.")
    if user_in.username:
        existing_user = crud.user.get_user_by_username(db, username=user_in.username)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Username already taken.")

    user = crud.user.update_user(db, db_user=current_user, user_in=user_in)
    return user