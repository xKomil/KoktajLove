# backend/app/api/api_v1/endpoints/cocktails.py
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas # Upewnij się, że schemas jest importowane
from app.dependencies import get_db, get_current_active_user
from app.schemas.cocktail import CocktailWithDetails, CocktailCreate, CocktailUpdate # Kluczowe importy

router = APIRouter()

@router.post("/", response_model=CocktailWithDetails, status_code=status.HTTP_201_CREATED)
def create_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_in: CocktailCreate, # Użyj bezpośrednio zaimportowanego schematu
    current_user: models.User = Depends(get_current_active_user)
):
    # Walidacja czy składniki i tagi istnieją (jeśli chcesz to robić na poziomie endpointu)
    # Można przenieść tę logikę do CRUD lub zostawić tutaj.
    for ing_link in cocktail_in.ingredients:
        if not crud.ingredient.get_ingredient(db, ing_link.ingredient_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Składnik o ID {ing_link.ingredient_id} nie istnieje.")
    if cocktail_in.tags:
        for tag_link in cocktail_in.tags:
            if not crud.tag.get_tag(db, tag_link.tag_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tag o ID {tag_link.tag_id} nie istnieje.")

    try:
        created_cocktail_orm = crud.cocktail.create_cocktail(db=db, cocktail_in=cocktail_in, user_id=current_user.id)
    except ValueError as e: # Przechwyć ValueError z CRUD (dla duplikatów nazw lub innych problemów walidacyjnych)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, # 409 Conflict jest odpowiedni dla "już istnieje"
            detail=str(e)
        )
    except Exception as e: # Ogólny handler na wypadek innych nieprzewidzianych błędów z CRUD
        # TODO: Loguj błąd `e` po stronie serwera
        print(f"Internal server error: {e}") # Prosty print do logowania, w produkcji użyj loggera
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Wystąpił błąd podczas tworzenia koktajlu.")
    
    # Pobierz pełne dane do odpowiedzi za pomocą metody z CRUD
    cocktail_details = crud.cocktail.get_cocktail_details_for_response(db, created_cocktail_orm.id)
    if not cocktail_details:
        # TODO: Loguj ten błąd
        raise HTTPException(status_code=500, detail="Nie udało się pobrać szczegółów koktajlu po jego utworzeniu.")
    return cocktail_details


@router.get("/", response_model=List[CocktailWithDetails])
def read_cocktails(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Optional[models.User] = Depends(get_current_active_user) # Może być None, jeśli endpoint jest publiczny
):
    requesting_user_id = current_user.id if current_user else None
    cocktails_list_data = crud.cocktail.get_cocktails_for_listing(
        db, skip=skip, limit=limit, requesting_user_id=requesting_user_id
    )
    return cocktails_list_data


@router.get("/{cocktail_id}", response_model=CocktailWithDetails)
def read_cocktail(
    cocktail_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_active_user) # Może być None
):
    cocktail_details = crud.cocktail.get_cocktail_details_for_response(db, cocktail_id=cocktail_id)
    if cocktail_details is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony")
    
    # Sprawdzenie uprawnień do wyświetlenia prywatnego koktajlu
    if not cocktail_details.get("is_public"):
        if not current_user or cocktail_details.get("user_id") != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do wyświetlenia tego koktajlu.")
            
    return cocktail_details


@router.put("/{cocktail_id}", response_model=CocktailWithDetails)
def update_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    cocktail_in: CocktailUpdate, # Użyj bezpośrednio zaimportowanego schematu
    current_user: models.User = Depends(get_current_active_user)
):
    db_cocktail_orm = crud.cocktail.get_cocktail_orm_object(db, cocktail_id=cocktail_id)
    if not db_cocktail_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony")
    if db_cocktail_orm.user_id != current_user.id: # Tylko właściciel może edytować
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do edycji tego koktajlu.")

    # Walidacja czy nowe składniki i tagi istnieją (jeśli podano)
    if cocktail_in.ingredients:
        for ing_link in cocktail_in.ingredients:
            if not crud.ingredient.get_ingredient(db, ing_link.ingredient_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Składnik o ID {ing_link.ingredient_id} nie istnieje.")
    if cocktail_in.tags:
        for tag_link in cocktail_in.tags:
            if not crud.tag.get_tag(db, tag_link.tag_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tag o ID {tag_link.tag_id} nie istnieje.")
    
    try:
        updated_cocktail_orm = crud.cocktail.update_cocktail(db=db, db_cocktail_orm=db_cocktail_orm, cocktail_in=cocktail_in)
    except ValueError as e: # Przechwyć ValueError z CRUD (np. dla duplikatów nazw)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail=str(e)
        )
    except Exception as e:
        # TODO: Loguj błąd `e`
        print(f"Internal server error during update: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Wystąpił błąd podczas aktualizacji koktajlu.")
    
    cocktail_details = crud.cocktail.get_cocktail_details_for_response(db, updated_cocktail_orm.id)
    if not cocktail_details:
        # TODO: Loguj ten błąd
        raise HTTPException(status_code=500, detail="Nie udało się pobrać szczegółów koktajlu po aktualizacji.")
    return cocktail_details


@router.delete("/{cocktail_id}", response_model=CocktailWithDetails)
def delete_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    current_user: models.User = Depends(get_current_active_user)
):
    # Najpierw pobierz dane do odpowiedzi, zanim obiekt zostanie usunięty
    # Alternatywnie, obiekt ORM zwrócony przez delete_cocktail może być użyty do serializacji,
    # ale get_cocktail_details_for_response daje spójny format.
    cocktail_details_to_return = crud.cocktail.get_cocktail_details_for_response(db, cocktail_id)
    if not cocktail_details_to_return:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony")

    if cocktail_details_to_return.get("user_id") != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do usunięcia tego koktajlu.")
    
    deleted_cocktail_orm = crud.cocktail.delete_cocktail(db=db, cocktail_id=cocktail_id)
    # deleted_cocktail_orm będzie None, jeśli nie znaleziono, ale wcześniejszy check już to obsłużył.
    # Jeśli jakimś cudem by się tak stało:
    if not deleted_cocktail_orm: 
        raise HTTPException(status_code=404, detail="Koktajl nie znaleziony lub został już usunięty.")
        
    return cocktail_details_to_return