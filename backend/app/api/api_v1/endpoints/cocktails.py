from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user
from app.schemas.cocktail import (
    CocktailWithDetails, CocktailCreate, CocktailUpdate, 
    Cocktail as CocktailSchema, PaginatedCocktailResponse
)

router = APIRouter()

@router.post("/", response_model=CocktailWithDetails, status_code=status.HTTP_201_CREATED)
def create_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_in: CocktailCreate,
    current_user: models.User = Depends(get_current_active_user)
):
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
        print(f"Błąd podczas tworzenia koktajlu: {type(e).__name__} - {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Wystąpił wewnętrzny błąd serwera podczas tworzenia koktajlu.")

@router.get("/", response_model=PaginatedCocktailResponse)
def read_cocktails(
    db: Session = Depends(get_db),
    name: Optional[str] = Query(None, description="Nazwa koktajlu (częściowe dopasowanie)"),
    ingredient_ids: Optional[List[int]] = Query(None, description="Lista ID składników (koktajl musi zawierać wszystkie)"),
    tag_ids: Optional[List[int]] = Query(None, description="Lista ID tagów (koktajl musi zawierać wszystkie)"),
    page: int = Query(1, ge=1, description="Numer strony"),
    size: int = Query(12, ge=1, le=100, description="Liczba elementów na stronie"),
    current_user: Optional[models.User] = Depends(get_current_active_user)
):
    """
    Pobiera listę koktajli z możliwością filtrowania i paginacji.
    
    - **name**: Filtruje koktajle po nazwie (częściowe dopasowanie, nieczułe na wielkość liter)
    - **ingredient_ids**: Lista ID składników - koktajl musi zawierać WSZYSTKIE podane składniki
    - **tag_ids**: Lista ID tagów - koktajl musi zawierać WSZYSTKIE podane tagi  
    - **page**: Numer strony (domyślnie 1)
    - **size**: Liczba koktajli na stronie (domyślnie 12, maksymalnie 100)
    
    Zwraca koktajle publiczne oraz prywatne koktajle zalogowanego użytkownika (jeśli jest zalogowany).
    """
    
    try:
        # Przekaż user_id tylko jeśli użytkownik jest zalogowany
        user_id = current_user.id if current_user else None
        print(f"--- ENDPOINT read_cocktails RECEIVED ---")
        print(f"Name: {name}")
        print(f"Ingredient IDs: {ingredient_ids}") # <--- WAŻNE
        print(f"Tag IDs: {tag_ids}")             # <--- WAŻNE
        print(f"Page: {page}, Size: {size}")
        print(f"User ID (from current_user): {user_id}")
        
        result = crud.cocktail.get_cocktails(
            db=db,
            name=name,
            ingredient_ids=ingredient_ids,
            tag_ids=tag_ids,
            page=page,
            size=size,
            user_id=user_id
        )
        
        return PaginatedCocktailResponse(**result)
        
    except Exception as e:
        print(f"Błąd podczas pobierania koktajli: {type(e).__name__} - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Wystąpił błąd podczas pobierania koktajli."
        )

@router.get("/{cocktail_id}", response_model=CocktailWithDetails)
def read_cocktail(
    cocktail_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_active_user)
):
    cocktail_details = crud.cocktail.get_cocktail(db, cocktail_id=cocktail_id)
    if cocktail_details is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony.")
    
    if not cocktail_details.is_public:
        if not current_user or cocktail_details.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do wyświetlenia tego koktajlu.")
            
    return cocktail_details

@router.put("/{cocktail_id}", response_model=CocktailWithDetails)
def update_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    cocktail_in: CocktailUpdate,
    current_user: models.User = Depends(get_current_active_user)
):
    db_cocktail_orm = db.query(models.Cocktail).get(cocktail_id)
    if not db_cocktail_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony.")
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
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Aktualizacja spowodowałaby konflikt (np. zduplikowana nazwa).")
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        print(f"Błąd podczas aktualizacji koktajlu: {type(e).__name__} - {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Wystąpił wewnętrzny błąd serwera podczas aktualizacji koktajlu.")

@router.delete("/{cocktail_id}", response_model=CocktailSchema)
def delete_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    current_user: models.User = Depends(get_current_active_user)
):
    db_cocktail_orm = db.query(models.Cocktail).get(cocktail_id)
    if not db_cocktail_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Koktajl nie znaleziony.")

    if db_cocktail_orm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do usunięcia tego koktajlu.")
    
    deleted_cocktail_orm = crud.cocktail.delete_cocktail(db=db, cocktail_id=cocktail_id)
    
    if not deleted_cocktail_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie udało się usunąć koktajlu lub nie został on znaleziony.")
        
    return deleted_cocktail_orm