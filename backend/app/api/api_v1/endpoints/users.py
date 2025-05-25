# app/api/api_v1/endpoints/users.py

from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user

# Dodaj te importy jeśli ich nie ma:
from app.schemas.cocktail import CocktailWithDetails

router = APIRouter()

# --- Endpoint /me ---
@router.get("/me", response_model=schemas.User)
def read_current_user(
    current_user: models.User = Depends(get_current_active_user)
):
    print(f"--- DEBUG [users.py /me] --- Endpoint /me trafiony dla użytkownika: {current_user.username if current_user else 'None'}")
    return current_user

# --- Endpoint listy użytkowników ---
@router.get("/", response_model=List[schemas.User])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    users = crud.user.get_users(db, skip=skip, limit=limit)
    return users

# --- Endpoint pobierania użytkownika po ID ---
@router.get("/{user_id_param}", response_model=schemas.User)
def read_user_by_id_endpoint(
    user_id_param: int,
    db: Session = Depends(get_db),
):
    print(f"--- DEBUG [users.py /{{user_id}}] --- Pobieranie użytkownika o ID: {user_id_param}")
    db_user = crud.user.get_user(db, user_id=user_id_param)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie znaleziony.")
    return db_user

# --- FIXED ENDPOINT: Pobieranie koktajli użytkownika ---
@router.get(
    "/{user_id}/cocktails",
    response_model=List[schemas.CocktailWithDetails],
    summary="Pobierz koktajle stworzone przez użytkownika"
)
def read_user_cocktails(
    user_id: int,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Liczba rekordów do pominięcia (paginacja)"),
    limit: int = Query(10, ge=1, le=100, description="Maksymalna liczba rekordów do zwrócenia (paginacja)"),
    current_user: Optional[models.User] = Depends(get_current_active_user)  # Dodane dla uprawnień
):
    """
    Pobiera listę koktajli stworzonych przez użytkownika o podanym ID.
    """
    print(f"--- DEBUG [users.py /users/{{user_id}}/cocktails] --- Rozpoczynam pobieranie koktajli dla user_id: {user_id}, skip: {skip}, limit: {limit}")

    # 1. Sprawdź, czy użytkownik o podanym user_id istnieje
    db_user = crud.user.get_user(db, user_id=user_id)
    if not db_user:
        print(f"--- DEBUG [users.py /users/{{user_id}}/cocktails] --- Użytkownik o ID {user_id} nie znaleziony.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Użytkownik o ID {user_id} nie znaleziony."
        )
        
    # 2. POPRAWKA: Użyj crud.cocktail.get_cocktails z odpowiednimi parametrami
    try:
        # Określ widoczność koktajli - jeśli current_user to właściciel profilu, pokaż wszystkie
        # W przeciwnym razie pokaż tylko publiczne
        show_private = current_user and current_user.id == user_id
        
        # Wywołaj funkcję crud która już obsługuje wszystkie relacje i obliczenia
        result = crud.cocktail.get_cocktails_by_user(
            db=db,
            user_id=user_id,
            skip=skip,
            limit=limit,
            include_private=show_private
        )
        
        print(f"--- DEBUG [users.py /users/{{user_id}}/cocktails] --- Znaleziono {len(result)} koktajli dla użytkownika o ID {user_id}.")
        return result
        
    except Exception as e:
        print(f"--- DEBUG [users.py /users/{{user_id}}/cocktails] --- Błąd podczas pobierania koktajli: {str(e)}")
        import traceback
        traceback.print_exc()  # Wydrukuj pełny stack trace
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Wystąpił błąd podczas pobierania koktajli użytkownika."
        )

# --- Endpoint aktualizacji danych zalogowanego użytkownika ---
@router.put("/me", response_model=schemas.User)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.User:
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
        # Upewnij się, że sygnatura crud.user.update_user jest db_obj, obj_in
        user = crud.user.update_user(db=db, db_user=current_user, user_in=user_in) 
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nie można zaktualizować użytkownika. Podana nazwa użytkownika lub email może już istnieć.")
    except Exception as e:
        db.rollback()
        print(f"Błąd podczas aktualizacji użytkownika: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Wystąpił błąd serwera podczas aktualizacji użytkownika.")
        
    return user