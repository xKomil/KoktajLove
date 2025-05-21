from typing import List, Any, Optional # Dodano Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user

router = APIRouter()

@router.post("/", response_model=schemas.Rating, status_code=status.HTTP_201_CREATED)
def create_rating(
    *,
    db: Session = Depends(get_db),
    rating_in: schemas.RatingCreate,
    current_user: models.User = Depends(get_current_active_user)
):
    # Pobierz obiekt ORM koktajlu, aby sprawdzić, czy istnieje
    cocktail_to_rate_orm = db.query(models.Cocktail).get(rating_in.cocktail_id) # <<<--- POPRAWKA
    if not cocktail_to_rate_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony.")

    if cocktail_to_rate_orm.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nie możesz oceniać własnych koktajli."
        )

    try:
        rating_orm = crud.rating.create_rating(db=db, rating_in=rating_in, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) # np. "Użytkownik już ocenił ten koktajl."
    return rating_orm

@router.get("/cocktail/{cocktail_id}", response_model=List[schemas.Rating])
def read_ratings_for_cocktail(
    cocktail_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10,
):
    cocktail_to_check_orm = db.query(models.Cocktail).get(cocktail_id) # <<<--- POPRAWKA
    if not cocktail_to_check_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony.")

    ratings_orm_list = crud.rating.get_ratings_for_cocktail(db, cocktail_id=cocktail_id, skip=skip, limit=limit)
    return ratings_orm_list

@router.put("/{rating_id}", response_model=schemas.Rating)
def update_my_rating(
    *,
    db: Session = Depends(get_db),
    rating_id: int,
    rating_in: schemas.RatingUpdate,
    current_user: models.User = Depends(get_current_active_user)
):
    db_rating_orm = crud.rating.get_rating(db, rating_id=rating_id)
    if not db_rating_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ocena nie znaleziona.")
    if db_rating_orm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do edycji tej oceny.")
    
    updated_rating_orm = crud.rating.update_rating(db=db, db_rating=db_rating_orm, rating_in=rating_in)
    return updated_rating_orm

@router.delete("/{rating_id}", response_model=schemas.Rating)
def delete_my_rating(
    *,
    db: Session = Depends(get_db),
    rating_id: int,
    current_user: models.User = Depends(get_current_active_user)
):
    db_rating_orm = crud.rating.get_rating(db, rating_id=rating_id)
    if not db_rating_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ocena nie znaleziona.")
    if db_rating_orm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do usunięcia tej oceny.")
    
    deleted_rating_orm = crud.rating.delete_rating(db=db, rating_id=rating_id)
    if not deleted_rating_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ocena nie znaleziona lub została już usunięta.")
    return deleted_rating_orm