from typing import List, Any # Any może nie być potrzebne, ale nie zaszkodzi
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas # Upewnij się, że schemas jest importowane
from app.dependencies import get_db, get_current_active_user

router = APIRouter()

@router.post("/", response_model=schemas.Rating, status_code=status.HTTP_201_CREATED)
def create_rating(
    *,
    db: Session = Depends(get_db),
    rating_in: schemas.RatingCreate,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Create a new rating for a cocktail.
    A user can only rate a cocktail once.
    """
    # Pobierz obiekt ORM koktajlu, aby sprawdzić, czy istnieje i ewentualnie czy nie jest to własny koktajl
    cocktail_to_rate = crud.cocktail.get_cocktail_orm_object(db, cocktail_id=rating_in.cocktail_id)
    if not cocktail_to_rate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cocktail not found")

    # Opcjonalnie: Sprawdź, czy autor koktajlu to ten sam użytkownik, który próbuje ocenić
    # if cocktail_to_rate.user_id == current_user.id:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Users cannot rate their own cocktails."
    #     )

    try:
        rating_orm = crud.rating.create_rating(db=db, rating_in=rating_in, user_id=current_user.id)
    except ValueError as e: # Przechwycenie np. "User has already rated this cocktail."
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return rating_orm # FastAPI zmapuje obiekt ORM na schemas.Rating

@router.get("/cocktail/{cocktail_id}", response_model=List[schemas.Rating])
def read_ratings_for_cocktail(
    cocktail_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10, # Zmniejszyłem domyślny limit dla ocen, 100 to dużo
):
    """
    Get all ratings for a specific cocktail.
    """
    # Sprawdź, czy koktajl istnieje, zanim pobierzesz jego oceny
    cocktail_to_check = crud.cocktail.get_cocktail_orm_object(db, cocktail_id=cocktail_id) # <<<--- POPRAWKA TUTAJ
    if not cocktail_to_check:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cocktail not found")

    ratings_orm_list = crud.rating.get_ratings_for_cocktail(db, cocktail_id=cocktail_id, skip=skip, limit=limit)
    return ratings_orm_list # FastAPI zmapuje listę obiektów ORM na List[schemas.Rating]

@router.put("/{rating_id}", response_model=schemas.Rating)
def update_my_rating(
    *,
    db: Session = Depends(get_db),
    rating_id: int,
    rating_in: schemas.RatingUpdate,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update a rating made by the current user.
    """
    db_rating_orm = crud.rating.get_rating(db, rating_id=rating_id)
    if not db_rating_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")
    if db_rating_orm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    
    updated_rating_orm = crud.rating.update_rating(db=db, db_rating=db_rating_orm, rating_in=rating_in)
    return updated_rating_orm # FastAPI zmapuje obiekt ORM na schemas.Rating

@router.delete("/{rating_id}", response_model=schemas.Rating)
def delete_my_rating(
    *,
    db: Session = Depends(get_db),
    rating_id: int,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Delete a rating made by the current user.
    """
    db_rating_orm = crud.rating.get_rating(db, rating_id=rating_id)
    if not db_rating_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")
    if db_rating_orm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    
    deleted_rating_orm = crud.rating.delete_rating(db=db, rating_id=rating_id)
    if not deleted_rating_orm: # Na wypadek, gdyby między get a delete ktoś inny usunął
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found or already deleted")
    return deleted_rating_orm # FastAPI zmapuje obiekt ORM na schemas.Rating