from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user # Można dodać zależność admina

router = APIRouter()

@router.post("/", response_model=schemas.Ingredient, status_code=status.HTTP_201_CREATED)
def create_ingredient(
    *,
    db: Session = Depends(get_db),
    ingredient_in: schemas.IngredientCreate,
    # current_user: models.User = Depends(get_current_active_user) # Wymagaj admina do tworzenia
):
    """
    Create new ingredient. (Protected - example for admin only)
    """
    # if not crud.user.is_superuser(current_user):
    #     raise HTTPException(status_code=403, detail="Not enough permissions")
    existing_ingredient = crud.ingredient.get_ingredient_by_name(db, name=ingredient_in.name)
    if existing_ingredient:
        raise HTTPException(status_code=400, detail="Ingredient with this name already exists")
    ingredient = crud.ingredient.create_ingredient(db=db, ingredient_in=ingredient_in)
    return ingredient

@router.get("/", response_model=List[schemas.Ingredient])
def read_ingredients(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve ingredients.
    """
    ingredients = crud.ingredient.get_ingredients(db, skip=skip, limit=limit)
    return ingredients

@router.get("/{ingredient_id}", response_model=schemas.Ingredient)
def read_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db),
):
    """
    Get ingredient by ID.
    """
    db_ingredient = crud.ingredient.get_ingredient(db, ingredient_id=ingredient_id)
    if db_ingredient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    return db_ingredient

@router.put("/{ingredient_id}", response_model=schemas.Ingredient)
def update_ingredient(
    *,
    db: Session = Depends(get_db),
    ingredient_id: int,
    ingredient_in: schemas.IngredientUpdate,
    # current_user: models.User = Depends(get_current_active_user) # Wymagaj admina
):
    """
    Update an ingredient. (Protected - example for admin only)
    """
    # if not crud.user.is_superuser(current_user):
    #     raise HTTPException(status_code=403, detail="Not enough permissions")
    db_ingredient = crud.ingredient.get_ingredient(db, ingredient_id=ingredient_id)
    if not db_ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    if ingredient_in.name:
        existing_ingredient = crud.ingredient.get_ingredient_by_name(db, name=ingredient_in.name)
        if existing_ingredient and existing_ingredient.id != ingredient_id:
            raise HTTPException(status_code=400, detail="Ingredient with this name already exists")
    ingredient = crud.ingredient.update_ingredient(db=db, db_ingredient=db_ingredient, ingredient_in=ingredient_in)
    return ingredient

@router.delete("/{ingredient_id}", response_model=schemas.Ingredient)
def delete_ingredient(
    *,
    db: Session = Depends(get_db),
    ingredient_id: int,
    # current_user: models.User = Depends(get_current_active_user) # Wymagaj admina
):
    """
    Delete an ingredient. (Protected - example for admin only)
    """
    # if not crud.user.is_superuser(current_user):
    #     raise HTTPException(status_code=403, detail="Not enough permissions")
    db_ingredient = crud.ingredient.get_ingredient(db, ingredient_id=ingredient_id)
    if not db_ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    
    # Sprawdzenie, czy składnik nie jest używany (jeśli ondelete="RESTRICT")
    # Można dodać logikę sprawdzającą relacje przed usunięciem
    # if db_ingredient.cocktails: # Zakładając, że relacja jest załadowana
    #     raise HTTPException(status_code=400, detail="Cannot delete ingredient, it is used in cocktails.")

    deleted_ingredient = crud.ingredient.delete_ingredient(db=db, ingredient_id=ingredient_id)
    if deleted_ingredient is None: # Może się zdarzyć przy IntegrityError z ondelete="RESTRICT"
        raise HTTPException(status_code=400, detail="Ingredient could not be deleted, possibly in use.")
    return deleted_ingredient