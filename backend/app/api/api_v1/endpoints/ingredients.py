from typing import List, Any, Optional # Dodano Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user

router = APIRouter()

@router.post("/", response_model=schemas.Ingredient, status_code=status.HTTP_201_CREATED)
def create_ingredient(
    *,
    db: Session = Depends(get_db),
    ingredient_in: schemas.IngredientCreate,
    # current_user: models.User = Depends(get_current_active_user) # Odkomentuj, jeśli wymagasz admina
):
    # if not current_user or not getattr(current_user, 'is_superuser', False): # Przykład sprawdzania uprawnień admina
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień administratora.")
    existing_ingredient = crud.ingredient.get_ingredient_by_name(db, name=ingredient_in.name)
    if existing_ingredient:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Składnik o tej nazwie już istnieje.")
    ingredient = crud.ingredient.create_ingredient(db=db, ingredient_in=ingredient_in)
    return ingredient

@router.get("/", response_model=List[schemas.Ingredient])
def read_ingredients(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    ingredients = crud.ingredient.get_ingredients(db, skip=skip, limit=limit)
    return ingredients

@router.get("/{ingredient_id}", response_model=schemas.Ingredient)
def read_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db),
):
    db_ingredient = crud.ingredient.get_ingredient(db, ingredient_id=ingredient_id)
    if db_ingredient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Składnik nie znaleziony.")
    return db_ingredient

@router.put("/{ingredient_id}", response_model=schemas.Ingredient)
def update_ingredient(
    *,
    db: Session = Depends(get_db),
    ingredient_id: int,
    ingredient_in: schemas.IngredientUpdate,
    # current_user: models.User = Depends(get_current_active_user) # Odkomentuj, jeśli wymagasz admina
):
    # if not current_user or not getattr(current_user, 'is_superuser', False):
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień administratora.")
    db_ingredient = crud.ingredient.get_ingredient(db, ingredient_id=ingredient_id)
    if not db_ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Składnik nie znaleziony.")
    if ingredient_in.name and ingredient_in.name != db_ingredient.name:
        existing_ingredient = crud.ingredient.get_ingredient_by_name(db, name=ingredient_in.name)
        if existing_ingredient and existing_ingredient.id != ingredient_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Składnik o tej nazwie już istnieje.")
    ingredient = crud.ingredient.update_ingredient(db=db, db_ingredient=db_ingredient, ingredient_in=ingredient_in)
    return ingredient

@router.delete("/{ingredient_id}", response_model=schemas.Ingredient)
def delete_ingredient(
    *,
    db: Session = Depends(get_db),
    ingredient_id: int,
    # current_user: models.User = Depends(get_current_active_user) # Odkomentuj, jeśli wymagasz admina
):
    # if not current_user or not getattr(current_user, 'is_superuser', False):
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień administratora.")
    db_ingredient = crud.ingredient.get_ingredient(db, ingredient_id=ingredient_id)
    if not db_ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Składnik nie znaleziony.")
    
    deleted_ingredient = crud.ingredient.delete_ingredient(db=db, ingredient_id=ingredient_id)
    if deleted_ingredient is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nie można usunąć składnika, prawdopodobnie jest używany w koktajlach.")
    return deleted_ingredient