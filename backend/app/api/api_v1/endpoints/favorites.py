# app/api/v1/favorites.py - Dodanie nowego endpointu sprawdzania statusu
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user
from app.schemas.cocktail import CocktailWithDetails

router = APIRouter()

# Schema dla odpowiedzi sprawdzania statusu ulubionego
class FavoriteStatusResponse(BaseModel):
    is_favorite: bool
    cocktail_id: int

@router.post("/", response_model=schemas.Favorite, status_code=status.HTTP_201_CREATED)
def add_cocktail_to_favorites(
    *,
    db: Session = Depends(get_db),
    favorite_in: schemas.FavoriteCreate,
    current_user: models.User = Depends(get_current_active_user)
):
    cocktail_to_favorite_orm = db.query(models.Cocktail).get(favorite_in.cocktail_id)
    if not cocktail_to_favorite_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony.")

    # Sprawdzenie, czy koktajl nie jest własnością użytkownika (jeśli nie chcesz pozwalać na to)
    # if cocktail_to_favorite_orm.user_id == current_user.id:
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nie możesz dodać własnego koktajlu do ulubionych.")

    existing_favorite = crud.favorite.get_favorite(db, user_id=current_user.id, cocktail_id=favorite_in.cocktail_id)
    if existing_favorite:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Koktajl jest już w ulubionych.")

    favorite = crud.favorite.create_favorite(db=db, favorite_in=favorite_in, user_id=current_user.id)
    return favorite

@router.delete("/{cocktail_id}", response_model=schemas.Favorite)
def remove_cocktail_from_favorites(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    current_user: models.User = Depends(get_current_active_user)
):
    cocktail_to_check_orm = db.query(models.Cocktail).get(cocktail_id)
    if not cocktail_to_check_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl (do usunięcia z ulubionych) nie znaleziony.")

    deleted_favorite = crud.favorite.delete_favorite(db=db, user_id=current_user.id, cocktail_id=cocktail_id)
    if not deleted_favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony w ulubionych tego użytkownika.")
    return deleted_favorite

@router.get("/my-favorites", response_model=List[schemas.Favorite])
def read_my_favorites(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    favorites = crud.favorite.get_user_favorites(db, user_id=current_user.id, skip=skip, limit=limit)
    return favorites

@router.get("/my-favorites/cocktails", response_model=List[CocktailWithDetails])
def read_my_favorite_cocktails_details(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    user_favorites_orm = crud.favorite.get_user_favorites(db, user_id=current_user.id, skip=skip, limit=limit)
        
    detailed_cocktails: List[CocktailWithDetails] = []
    if not user_favorites_orm:
        return []
            
    for fav_orm in user_favorites_orm:
        cocktail_details = crud.cocktail.get_cocktail(db, fav_orm.cocktail_id)
        if cocktail_details:
            detailed_cocktails.append(cocktail_details)
                 
    return detailed_cocktails

# NOWY ENDPOINT - Sprawdzanie statusu ulubionego koktajlu
@router.get("/cocktail/{cocktail_id}/status", response_model=FavoriteStatusResponse)
def check_cocktail_favorite_status(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Sprawdza, czy określony koktajl jest w ulubionych aktualnie zalogowanego użytkownika.
    """
    # Najpierw sprawdź, czy koktajl w ogóle istnieje
    cocktail_orm = db.query(models.Cocktail).get(cocktail_id)
    if not cocktail_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony.")
    
    # Sprawdź, czy koktajl jest w ulubionych użytkownika
    existing_favorite = crud.favorite.get_favorite(db, user_id=current_user.id, cocktail_id=cocktail_id)
    
    return FavoriteStatusResponse(
        is_favorite=existing_favorite is not None,
        cocktail_id=cocktail_id
    )