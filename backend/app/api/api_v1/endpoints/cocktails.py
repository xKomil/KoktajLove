from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas # Upewnij się, że schemas jest importowane
from app.dependencies import get_db, get_current_active_user
from app.schemas.cocktail import CocktailWithDetails # Kluczowy import dla response_model

router = APIRouter()

@router.post("/", response_model=CocktailWithDetails, status_code=status.HTTP_201_CREATED)
def create_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_in: schemas.CocktailCreate,
    current_user: models.User = Depends(get_current_active_user)
):
    # Walidacja czy składniki i tagi istnieją (opcjonalne)
    for ing_link in cocktail_in.ingredients:
        if not crud.ingredient.get_ingredient(db, ing_link.ingredient_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ingredient with id {ing_link.ingredient_id} not found")
    for tag_link in cocktail_in.tags:
        if not crud.tag.get_tag(db, tag_link.tag_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tag with id {tag_link.tag_id} not found")

    try:
        created_cocktail_orm = crud.cocktail.create_cocktail(db=db, cocktail_in=cocktail_in, user_id=current_user.id)
    except ValueError as e: # Przechwyć ValueError z CRUD (dla duplikatów lub innych problemów)
        # Można by bardziej szczegółowo analizować treść błędu 'e', aby dostosować status code,
        # ale 409 jest ogólnie dobry dla konfliktu "już istnieje".
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail=str(e)
        )
    except Exception as e: # Ogólny handler na wypadek innych nieprzewidzianych błędów z CRUD
        # Loguj błąd `e` po stronie serwera
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An error occurred while creating the cocktail.")
    
    cocktail_details = crud.cocktail.get_cocktail_details_for_response(db, created_cocktail_orm.id)
    if not cocktail_details:
        raise HTTPException(status_code=500, detail="Failed to retrieve cocktail details after creation.")
    return cocktail_details

@router.get("/", response_model=List[CocktailWithDetails])
def read_cocktails(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    cocktails_list_data = crud.cocktail.get_cocktails_for_listing(db, skip=skip, limit=limit)
    return cocktails_list_data

@router.get("/{cocktail_id}", response_model=CocktailWithDetails)
def read_cocktail(
    cocktail_id: int,
    db: Session = Depends(get_db),
):
    cocktail_details = crud.cocktail.get_cocktail_details_for_response(db, cocktail_id=cocktail_id)
    if cocktail_details is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cocktail not found")
    # Tutaj można dodać logikę sprawdzania uprawnień, jeśli koktajl nie jest publiczny
    # if not cocktail_details.get("is_public") and (not current_user or cocktail_details.get("user_id") != current_user.id):
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return cocktail_details

@router.put("/{cocktail_id}", response_model=CocktailWithDetails)
def update_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    cocktail_in: schemas.CocktailUpdate,
    current_user: models.User = Depends(get_current_active_user)
):
    db_cocktail_orm = crud.cocktail.get_cocktail_orm_object(db, cocktail_id=cocktail_id)
    if not db_cocktail_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cocktail not found")
    if db_cocktail_orm.user_id != current_user.id: # Tylko właściciel (lub admin) może edytować
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Walidacja czy nowe składniki i tagi istnieją
    if cocktail_in.ingredients:
        for ing_link in cocktail_in.ingredients:
            if not crud.ingredient.get_ingredient(db, ing_link.ingredient_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ingredient with id {ing_link.ingredient_id} not found")
    if cocktail_in.tags:
        for tag_link in cocktail_in.tags:
            if not crud.tag.get_tag(db, tag_link.tag_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tag with id {tag_link.tag_id} not found")

    updated_cocktail_orm = crud.cocktail.update_cocktail(db=db, db_cocktail_orm=db_cocktail_orm, cocktail_in=cocktail_in)
    
    cocktail_details = crud.cocktail.get_cocktail_details_for_response(db, updated_cocktail_orm.id)
    if not cocktail_details:
        raise HTTPException(status_code=500, detail="Failed to retrieve cocktail details after update.")
    return cocktail_details

@router.delete("/{cocktail_id}", response_model=CocktailWithDetails)
def delete_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    current_user: models.User = Depends(get_current_active_user)
):
    # Najpierw pobierz dane do odpowiedzi, zanim obiekt zostanie usunięty
    cocktail_details_to_return = crud.cocktail.get_cocktail_details_for_response(db, cocktail_id)
    if not cocktail_details_to_return:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cocktail not found")

    # Sprawdź, czy użytkownik jest właścicielem (potrzebujemy obiektu ORM do tego)
    # db_cocktail_orm = crud.cocktail.get_cocktail_orm_object(db, cocktail_id=cocktail_id) # Już niepotrzebne, bo mamy dane z _details
    if cocktail_details_to_return.get("user_id") != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to delete this cocktail")
    
    deleted_cocktail_orm = crud.cocktail.delete_cocktail(db=db, cocktail_id=cocktail_id)
    if not deleted_cocktail_orm: # Powinno być już obsłużone przez pierwszy check
        raise HTTPException(status_code=404, detail="Cocktail not found or already deleted.")
        
    return cocktail_details_to_return # Zwracamy wcześniej pobrane dane