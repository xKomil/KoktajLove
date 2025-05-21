from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user
# Upewnij się, że masz import CocktailWithDetails, jeśli go używasz w response_model
from app.schemas.cocktail import CocktailWithDetails

router = APIRouter()

@router.post("/", response_model=schemas.Favorite, status_code=status.HTTP_201_CREATED)
def add_cocktail_to_favorites(
    *,
    db: Session = Depends(get_db),
    favorite_in: schemas.FavoriteCreate,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Add a cocktail to the current user's favorites.
    """
    # Użyj poprawnej metody do sprawdzenia, czy koktajl istnieje
    cocktail_to_favorite = crud.cocktail.get_cocktail_orm_object(db, cocktail_id=favorite_in.cocktail_id)
    if not cocktail_to_favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cocktail not found")

    existing_favorite = crud.favorite.get_favorite(db, user_id=current_user.id, cocktail_id=favorite_in.cocktail_id)
    if existing_favorite:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cocktail already in favorites")

    favorite = crud.favorite.create_favorite(db=db, favorite_in=favorite_in, user_id=current_user.id)
    return favorite

@router.delete("/{cocktail_id}", response_model=schemas.Favorite)
def remove_cocktail_from_favorites(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Remove a cocktail from the current user's favorites.
    """
    # Użyj poprawnej metody do sprawdzenia, czy koktajl w ogóle istnieje
    cocktail_to_check = crud.cocktail.get_cocktail_orm_object(db, cocktail_id=cocktail_id)
    if not cocktail_to_check:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cocktail (to be removed from favorites) not found")

    deleted_favorite = crud.favorite.delete_favorite(db=db, user_id=current_user.id, cocktail_id=cocktail_id)
    if not deleted_favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found for this user and cocktail")
    return deleted_favorite


@router.get("/my-favorites", response_model=List[schemas.Favorite])
def read_my_favorites(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """
    Get the current user's favorite cocktails (as Favorite objects).
    """
    favorites = crud.favorite.get_user_favorites(db, user_id=current_user.id, skip=skip, limit=limit)
    return favorites

@router.get("/my-favorites/cocktails", response_model=List[schemas.CocktailWithDetails])
def read_my_favorite_cocktails_details(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """
    Get the current user's favorite cocktails with full details.
    """
    user_favorites_orm = crud.favorite.get_user_favorites(db, user_id=current_user.id, skip=skip, limit=limit)
    
    detailed_cocktails: List[schemas.CocktailWithDetails] = []
    if not user_favorites_orm:
        return []
        
    for fav_orm in user_favorites_orm:
        # Użyj poprawnej metody do pobrania danych koktajlu sformatowanych dla CocktailWithDetails
        cocktail_details = crud.cocktail.get_cocktail_details_for_response(db, fav_orm.cocktail_id)
        if cocktail_details:
            # FastAPI automatycznie zwaliduje `cocktail_details` (który jest słownikiem)
            # względem typu elementu listy w `response_model`, czyli CocktailWithDetails.
            detailed_cocktails.append(cocktail_details) 
            
    return detailed_cocktails