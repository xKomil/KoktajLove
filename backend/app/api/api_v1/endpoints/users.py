from typing import List, Any, Optional # Dodano Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError # Potrzebne, jeśli CRUD rzuca IntegrityError przy update

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[schemas.User])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    # current_user: models.User = Depends(get_current_active_user) # Rozważ dla uprawnień admina
):
    """
    Pobiera listę użytkowników.
    """
    # Przykład implementacji uprawnień admina:
    # if not current_user or not current_user.is_superuser: # Zakładając, że model User ma pole is_superuser
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień.")
    users = crud.user.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=schemas.User)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    # current_user: models.User = Depends(get_current_active_user) # Jeśli dostęp ma być chroniony
):
    """
    Pobiera użytkownika po ID.
    """
    db_user = crud.user.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie znaleziony.")
    return db_user


@router.put("/me", response_model=schemas.User)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.User: # Zmieniono Any na schemas.User
    """
    Aktualizuje dane zalogowanego użytkownika.
    """
    # Sprawdzenie, czy nowy email lub username nie są już zajęte (jeśli są zmieniane)
    if user_in.email and user_in.email != current_user.email:
        existing_user = crud.user.get_user_by_email(db, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adres email jest już zarejestrowany przez innego użytkownika.")
    
    if user_in.username and user_in.username != current_user.username:
        existing_user = crud.user.get_user_by_username(db, username=user_in.username)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nazwa użytkownika jest już zajęta.")

    try:
        user = crud.user.update_user(db, db_user=current_user, user_in=user_in)
    except IntegrityError: # Jeśli baza danych rzuci błąd unikalności mimo wszystko
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nie można zaktualizować użytkownika. Podana nazwa użytkownika lub email może już istnieć.")
    except Exception as e:
        db.rollback()
        # Loguj błąd e
        print(f"Błąd podczas aktualizacji użytkownika: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Wystąpił błąd serwera podczas aktualizacji użytkownika.")
        
    return user