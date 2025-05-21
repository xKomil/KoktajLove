from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user
from app.schemas.cocktail import CocktailWithDetails, CocktailCreate, CocktailUpdate, Cocktail as CocktailSchema # Zmieniono na CocktailSchema

router = APIRouter()

@router.post("/", response_model=CocktailWithDetails, status_code=status.HTTP_201_CREATED)
def create_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_in: CocktailCreate, # Pydantic automatycznie zwaliduje amount jako int i unit jako UnitEnum
    current_user: models.User = Depends(get_current_active_user)
):
    # Walidacja istnienia składników i tagów
    for ing_data in cocktail_in.ingredients:
        if not crud.ingredient.get_ingredient(db, ing_data.ingredient_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Składnik o ID {ing_data.ingredient_id} nie istnieje.")
    if cocktail_in.tags:
        for tag_data in cocktail_in.tags:
            if not crud.tag.get_tag(db, tag_data.tag_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tag o ID {tag_data.tag_id} nie istnieje.")

    try:
        created_cocktail_details = crud.cocktail.create_cocktail(db=db, cocktail_in=cocktail_in, user_id=current_user.id)
        if not created_cocktail_details:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Nie udało się utworzyć koktajlu.")
        return created_cocktail_details
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Koktajl o tej nazwie już istnieje.")
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        print(f"Error creating cocktail: {type(e).__name__} - {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Wystąpił wewnętrzny błąd serwera.")


@router.get("/", response_model=List[CocktailWithDetails])
def read_cocktails(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    cocktails_details_list = crud.cocktail.get_cocktails(db, skip=skip, limit=limit)
    return cocktails_details_list


@router.get("/{cocktail_id}", response_model=CocktailWithDetails)
def read_cocktail(
    cocktail_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_active_user)
):
    cocktail_details = crud.cocktail.get_cocktail(db, cocktail_id=cocktail_id)
    if cocktail_details is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony")
    
    if not cocktail_details.is_public:
        if not current_user or cocktail_details.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do wyświetlenia tego koktajlu.")
            
    return cocktail_details


@router.put("/{cocktail_id}", response_model=CocktailWithDetails)
def update_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    cocktail_in: CocktailUpdate, # Pydantic zwaliduje amount jako int i unit jako UnitEnum
    current_user: models.User = Depends(get_current_active_user)
):
    db_cocktail_orm = db.query(models.Cocktail).get(cocktail_id)
    if not db_cocktail_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony")
    if db_cocktail_orm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do edycji tego koktajlu.")

    if cocktail_in.ingredients is not None:
        for ing_data in cocktail_in.ingredients:
            if not crud.ingredient.get_ingredient(db, ing_data.ingredient_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Składnik o ID {ing_data.ingredient_id} nie istnieje.")
    if cocktail_in.tags is not None:
        for tag_data in cocktail_in.tags:
            if not crud.tag.get_tag(db, tag_data.tag_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tag o ID {tag_data.tag_id} nie istnieje.")
    
    try:
        updated_cocktail_details = crud.cocktail.update_cocktail(db=db, db_cocktail_orm=db_cocktail_orm, cocktail_in=cocktail_in)
        if not updated_cocktail_details:
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Nie udało się zaktualizować koktajlu.")
        return updated_cocktail_details
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Aktualizacja spowodowałaby konflikt.")
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        print(f"Error updating cocktail: {type(e).__name__} - {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Wystąpił wewnętrzny błąd serwera.")


@router.delete("/{cocktail_id}", response_model=CocktailSchema) # Użyj zaimportowanego CocktailSchema
def delete_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    current_user: models.User = Depends(get_current_active_user)
):
    db_cocktail_orm = db.query(models.Cocktail).get(cocktail_id)
    if not db_cocktail_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony")

    if db_cocktail_orm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do usunięcia tego koktajlu.")
    
    deleted_cocktail_orm = crud.cocktail.delete_cocktail(db=db, cocktail_id=cocktail_id)
    
    if not deleted_cocktail_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie udało się usunąć koktajlu.")
        
    return deleted_cocktail_orm