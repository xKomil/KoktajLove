# app/api/api_v1/endpoints/users.py

from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query # Dodaj Query dla parametrów zapytania
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app import crud, models, schemas # Upewnij się, że masz Cocktail w schemas
from app.dependencies import get_db, get_current_active_user

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
@router.get("/{user_id_param}", response_model=schemas.User) # Zmieniono nazwę parametru, aby uniknąć konfliktu z user_id w get_user_cocktails
def read_user_by_id_endpoint( # Zmieniono nazwę funkcji
    user_id_param: int, # Zmieniono nazwę parametru
    db: Session = Depends(get_db),
):
    print(f"--- DEBUG [users.py /{{user_id}}] --- Pobieranie użytkownika o ID: {user_id_param}")
    db_user = crud.user.get_user(db, user_id=user_id_param) # Użyj user_id_param
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie znaleziony.")
    return db_user

# --- NOWY ENDPOINT: Pobieranie koktajli użytkownika ---
@router.get(
    "/{user_id}/cocktails", # Ścieżka endpointu
    response_model=List[schemas.CocktailWithDetails], # Użyj schematu z detalami
    summary="Pobierz koktajle stworzone przez użytkownika"
)
def read_user_cocktails(
    user_id: int, # Parametr ścieżki
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Liczba rekordów do pominięcia (paginacja)"),
    limit: int = Query(10, ge=1, le=100, description="Maksymalna liczba rekordów do zwrócenia (paginacja)")
    # current_user: models.User = Depends(get_current_active_user) # Opcjonalnie, jeśli chcesz chronić ten endpoint
):
    """
    Pobiera listę koktajli stworzonych przez użytkownika o podanym ID.
    """
    print(f"--- DEBUG [users.py /users/{{user_id}}/cocktails] --- Rozpoczynam pobieranie koktajli dla user_id: {user_id}, skip: {skip}, limit: {limit}")

    # 1. Sprawdź, czy użytkownik o podanym user_id istnieje (dobre praktyki)
    db_user = crud.user.get_user(db, user_id=user_id)
    if not db_user:
        print(f"--- DEBUG [users.py /users/{{user_id}}/cocktails] --- Użytkownik o ID {user_id} nie znaleziony.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Użytkownik o ID {user_id} nie znaleziony."
        )

    # 2. Użyj istniejącej funkcji CRUD z crud_cocktail do pobrania koktajli tego użytkownika
    cocktails = crud.cocktail.get_cocktails( # Używamy Twojej funkcji get_cocktails
        db=db, user_id=user_id, skip=skip, limit=limit # Przekazujemy user_id
    )

    if not cocktails: # get_cocktails zwraca pustą listę, jeśli nie ma
        print(f"--- DEBUG [users.py /users/{{user_id}}/cocktails] --- Nie znaleziono koktajli dla użytkownika o ID {user_id}.")
        return [] # Zwróć pustą listę - to jest poprawne zachowanie
    
    print(f"--- DEBUG [users.py /users/{{user_id}}/cocktails] --- Znaleziono {len(cocktails)} koktajli dla użytkownika o ID {user_id}.")
    return cocktails


# --- Endpoint aktualizacji danych zalogowanego użytkownika ---
@router.put("/me", response_model=schemas.User)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> schemas.User:
    # ... (reszta Twojego kodu update_user_me - wygląda OK) ...
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
        user = crud.user.update_user(db=db, db_obj=current_user, obj_in=user_in) 
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nie można zaktualizować użytkownika. Podana nazwa użytkownika lub email może już istnieć.")
    except Exception as e:
        db.rollback()
        print(f"Błąd podczas aktualizacji użytkownika: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Wystąpił błąd serwera podczas aktualizacji użytkownika.")
        
    return user