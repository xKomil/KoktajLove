# backend/app/api/api_v1/endpoints/cocktails.py
from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user, require_current_active_user
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
    current_user: models.User = Depends(require_current_active_user)
):
    """
    Tworzy nowy koktajl.
    
    Wymaga autoryzacji. Waliduje istnienie wszystkich składników i tagów
    przed utworzeniem koktajlu.
    
    Args:
        cocktail_in: Dane nowego koktajlu (nazwa, składniki, tagi, etc.)
        current_user: Zalogowany użytkownik (automatycznie przypisywany jako autor)
    
    Returns:
        CocktailWithDetails: Utworzony koktajl z pełnymi detalami
        
    Raises:
        400: Gdy składnik lub tag nie istnieje
        409: Gdy koktajl o podanej nazwie już istnieje
        500: Błąd wewnętrzny serwera
    """
    # Walidacja istnienia składników
    for ing_data in cocktail_in.ingredients:
        if not crud.ingredient.get_ingredient(db, ing_data.ingredient_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Składnik o ID {ing_data.ingredient_id} nie istnieje."
            )
    
    # Walidacja istnienia tagów
    if cocktail_in.tags:
        for tag_data in cocktail_in.tags:
            if not crud.tag.get_tag(db, tag_data.tag_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Tag o ID {tag_data.tag_id} nie istnieje."
                )

    try:
        created_cocktail_details = crud.cocktail.create_cocktail(
            db=db, 
            cocktail_in=cocktail_in, 
            user_id=current_user.id
        )
        if not created_cocktail_details:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Nie udało się utworzyć koktajlu."
            )
        return created_cocktail_details
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Koktajl o tej nazwie już istnieje."
        )
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        print(f"Błąd podczas tworzenia koktajlu: {type(e).__name__} - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Wystąpił wewnętrzny błąd serwera podczas tworzenia koktajlu."
        )

@router.get("/", response_model=PaginatedCocktailResponse)
def read_cocktails(
    db: Session = Depends(get_db),
    name: Optional[str] = Query(None, description="Nazwa koktajlu (częściowe dopasowanie)"),
    ingredient_ids: Optional[List[int]] = Query(None, description="Lista ID składników (koktajl musi zawierać wszystkie)"),
    tag_ids: Optional[List[int]] = Query(None, description="Lista ID tagów (koktajl musi zawierać wszystkie)"),
    min_avg_rating: Optional[float] = Query(None, ge=1, le=5, description="Minimalna średnia ocena koktajlu (1-5)"),
    page: int = Query(1, ge=1, description="Numer strony"),
    size: int = Query(12, ge=1, le=100, description="Liczba elementów na stronie"),
    current_user: Optional[models.User] = Depends(get_current_active_user)
):
    """
    Pobiera listę koktajli z możliwością filtrowania i paginacji.
    
    Dostępne dla wszystkich użytkowników - niezalogowani widzą tylko publiczne koktajle,
    zalogowani dodatkowo widzą swoje prywatne koktajle.
    
    Args:
        name: Filtruje koktajle po nazwie (częściowe dopasowanie, nieczułe na wielkość liter)
        ingredient_ids: Lista ID składników - koktajl musi zawierać WSZYSTKIE podane składniki
        tag_ids: Lista ID tagów - koktajl musi zawierać WSZYSTKIE podane tagi  
        min_avg_rating: Minimalna średnia ocena koktajlu (1-5) - wyświetla tylko koktajle z oceną równą lub wyższą
        page: Numer strony (domyślnie 1)
        size: Liczba koktajli na stronie (domyślnie 12, maksymalnie 100)
        current_user: Zalogowany użytkownik (opcjonalny)
    
    Returns:
        PaginatedCocktailResponse: Lista koktajli z informacjami o paginacji
        
    Notes:
        - Każdy koktajl zawiera informacje o średniej ocenie (average_rating) i liczbie ocen (ratings_count)
        - Koktajle bez ocen mają average_rating=None i ratings_count=0
        - Filtr min_avg_rating uwzględnia tylko koktajle, które mają przynajmniej jedną ocenę
    """
    
    try:
        # Przekaż user_id tylko jeśli użytkownik jest zalogowany
        user_id = current_user.id if current_user else None
        
        print(f"--- ENDPOINT read_cocktails RECEIVED ---")
        print(f"Name: {name}")
        print(f"Ingredient IDs: {ingredient_ids}")
        print(f"Tag IDs: {tag_ids}")
        print(f"Min Avg Rating: {min_avg_rating}")
        print(f"Page: {page}, Size: {size}")
        print(f"User ID (from current_user): {user_id}")
        
        result = crud.cocktail.get_cocktails(
            db=db,
            name=name,
            ingredient_ids=ingredient_ids,
            tag_ids=tag_ids,
            min_avg_rating=min_avg_rating,
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
    """
    Pobiera szczegóły pojedynczego koktajlu.
    
    Dostępne dla wszystkich użytkowników dla publicznych koktajli.
    Prywatne koktajle dostępne tylko dla ich autorów.
    
    Args:
        cocktail_id: ID koktajlu do pobrania
        current_user: Zalogowany użytkownik (opcjonalny)
    
    Returns:
        CocktailWithDetails: Szczegóły koktajlu z średnią oceną i liczbą ocen
        
    Raises:
        404: Koktajl nie znaleziony
        403: Brak uprawnień do wyświetlenia prywatnego koktajlu
    """
    cocktail_details = crud.cocktail.get_cocktail(db, cocktail_id=cocktail_id)
    if cocktail_details is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Koktajl nie znaleziony."
        )
    
    # Sprawdzenie uprawnień dla prywatnych koktajli
    if not cocktail_details.is_public:
        if not current_user or cocktail_details.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Brak uprawnień do wyświetlenia tego koktajlu."
            )
            
    return cocktail_details

@router.put("/{cocktail_id}", response_model=CocktailWithDetails)
def update_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    cocktail_in: CocktailUpdate,
    current_user: models.User = Depends(require_current_active_user)
):
    """
    Aktualizuje istniejący koktajl.
    
    Wymaga autoryzacji. Tylko autor koktajlu może go edytować.
    
    Args:
        cocktail_id: ID koktajlu do aktualizacji
        cocktail_in: Dane do aktualizacji (wszystkie pola opcjonalne)
        current_user: Zalogowany użytkownik (musi być autorem koktajlu)
    
    Returns:
        CocktailWithDetails: Zaktualizowany koktajl z pełnymi detalami
        
    Raises:
        404: Koktajl nie znaleziony
        403: Brak uprawnień do edycji koktajlu
        400: Składnik lub tag nie istnieje
        409: Aktualizacja spowodowałaby konflikt (np. zduplikowana nazwa)
        500: Błąd wewnętrzny serwera
    """
    # Sprawdzenie czy koktajl istnieje
    db_cocktail_orm = db.query(models.Cocktail).get(cocktail_id)
    if not db_cocktail_orm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Koktajl nie znaleziony."
        )
    
    # Sprawdzenie uprawnień
    if db_cocktail_orm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Brak uprawnień do edycji tego koktajlu."
        )

    # Walidacja składników (jeśli są aktualizowane)
    if cocktail_in.ingredients is not None:
        for ing_data in cocktail_in.ingredients:
            if not crud.ingredient.get_ingredient(db, ing_data.ingredient_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Składnik o ID {ing_data.ingredient_id} nie istnieje."
                )
    
    # Walidacja tagów (jeśli są aktualizowane)
    if cocktail_in.tags is not None:
        for tag_data in cocktail_in.tags:
            if not crud.tag.get_tag(db, tag_data.tag_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Tag o ID {tag_data.tag_id} nie istnieje."
                )
    
    try:
        updated_cocktail_details = crud.cocktail.update_cocktail(
            db=db, 
            db_cocktail_orm=db_cocktail_orm, 
            cocktail_in=cocktail_in
        )
        if not updated_cocktail_details:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Nie udało się zaktualizować koktajlu."
            )
        return updated_cocktail_details
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Aktualizacja spowodowałaby konflikt (np. zduplikowana nazwa)."
        )
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        print(f"Błąd podczas aktualizacji koktajlu: {type(e).__name__} - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Wystąpił wewnętrzny błąd serwera podczas aktualizacji koktajlu."
        )

@router.delete("/{cocktail_id}", response_model=CocktailSchema)
def delete_cocktail(
    *,
    db: Session = Depends(get_db),
    cocktail_id: int,
    current_user: models.User = Depends(require_current_active_user)
):
    """
    Usuwa koktajl.
    
    Wymaga autoryzacji. Tylko autor koktajlu może go usunąć.
    
    Args:
        cocktail_id: ID koktajlu do usunięcia
        current_user: Zalogowany użytkownik (musi być autorem koktajlu)
    
    Returns:
        CocktailSchema: Podstawowe informacje o usuniętym koktajlu
        
    Raises:
        404: Koktajl nie znaleziony
        403: Brak uprawnień do usunięcia koktajlu
        500: Błąd wewnętrzny serwera
    """
    # Sprawdzenie czy koktajl istnieje
    db_cocktail_orm = db.query(models.Cocktail).get(cocktail_id)
    if not db_cocktail_orm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Koktajl nie znaleziony."
        )
    
    # Sprawdzenie uprawnień - tylko autor może usunąć koktajl
    if db_cocktail_orm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Brak uprawnień do usunięcia tego koktajlu."
        )
    
    try:
        # Zapisanie danych przed usunięciem (do zwrócenia w odpowiedzi)
        cocktail_data = CocktailSchema.model_validate(db_cocktail_orm)
        
        # Usunięcie koktajlu
        deleted_cocktail = crud.cocktail.delete_cocktail(db, cocktail_id=cocktail_id)
        if not deleted_cocktail:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Nie udało się usunąć koktajlu."
            )
        
        return cocktail_data
        
    except Exception as e:
        db.rollback()
        print(f"Błąd podczas usuwania koktajlu: {type(e).__name__} - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Wystąpił wewnętrzny błąd serwera podczas usuwania koktajlu."
        )