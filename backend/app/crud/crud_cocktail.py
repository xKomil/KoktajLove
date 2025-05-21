from typing import Optional, List, Union
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import select, delete # Usunięto 'insert', bo nie jest bezpośrednio używany dla obiektów ORM w ten sposób

# Importy modeli
from app.models.cocktail import Cocktail, cocktail_ingredient_association, cocktail_tag_association
from app.models.ingredient import Ingredient
from app.models.tag import Tag
from app.models.user import User # Potrzebne, jeśli typujesz np. db_cocktail_orm.author

# Importy schematów
from app.schemas.cocktail import (
    CocktailCreate, CocktailUpdate, CocktailIngredientData, # CocktailTagData nie jest używane jako typ w CRUD
    CocktailWithDetails, IngredientInCocktailDetail, UnitEnum 
)
from app.schemas.user import User as UserSchema
from app.schemas.tag import Tag as TagSchema # Zmieniono alias dla spójności

class CRUDCocktail:

    def _build_cocktail_with_details(self, db: Session, cocktail_orm: Cocktail) -> Optional[CocktailWithDetails]:
        if not cocktail_orm:
            return None

        ingredients_details = []
        stmt_ing = (
            select(
                Ingredient.id,
                Ingredient.name,
                cocktail_ingredient_association.c.amount,
                cocktail_ingredient_association.c.unit
            )
            .join_from(cocktail_ingredient_association, Ingredient, cocktail_ingredient_association.c.ingredient_id == Ingredient.id)
            .where(cocktail_ingredient_association.c.cocktail_id == cocktail_orm.id)
        )
        
        for row in db.execute(stmt_ing).all():
            try:
                unit_enum_value = UnitEnum(row.unit) # Konwersja string z bazy na Enum
            except ValueError:
                unit_enum_value = UnitEnum.OTHER # Domyślna wartość w razie błędu
                # Warto zalogować ten przypadek
                print(f"WARNING: Invalid unit '{row.unit}' found in DB for cocktail ID {cocktail_orm.id}, ingredient ID {row.id}. Defaulting to '{UnitEnum.OTHER.value}'.")

            ingredients_details.append(IngredientInCocktailDetail(
                id=row.id, 
                name=row.name, 
                amount=row.amount, # amount jest już int z bazy
                unit=unit_enum_value
            ))

        # Załaduj relacje jeśli nie są już załadowane przez zapytanie główne
        # (joinedload(Cocktail.author) i selectinload(Cocktail.tags) powinny to załatwić)
        if not cocktail_orm.author: # Dodatkowe zabezpieczenie, choć joinedload powinien załadować
            db.refresh(cocktail_orm, ['author'])
        if not hasattr(cocktail_orm, 'tags') or not cocktail_orm.tags: # Sprawdzenie dla selectinload
             # selectinload działa inaczej, tags powinno być listą. Jeśli puste, to OK.
             # Jeśli atrybutu nie ma, można by odświeżyć: db.refresh(cocktail_orm, ['tags'])
             # Ale zapytania w get_cocktail/get_cocktails powinny to załadować.
             pass


        tags_pydantic = [TagSchema.model_validate(tag_orm) for tag_orm in cocktail_orm.tags]
        author_pydantic = UserSchema.model_validate(cocktail_orm.author)

        return CocktailWithDetails(
            id=cocktail_orm.id,
            name=cocktail_orm.name,
            description=cocktail_orm.description,
            instructions=cocktail_orm.instructions,
            image_url=str(cocktail_orm.image_url) if cocktail_orm.image_url else None,
            is_public=cocktail_orm.is_public,
            user_id=cocktail_orm.user_id,
            created_at=cocktail_orm.created_at,
            updated_at=cocktail_orm.updated_at,
            author=author_pydantic,
            ingredients=ingredients_details,
            tags=tags_pydantic
        )

    def get_cocktail(self, db: Session, cocktail_id: int) -> Optional[CocktailWithDetails]:
        cocktail_orm = (
            db.query(Cocktail)
            .options(
                joinedload(Cocktail.author), # Ładuje autora
                selectinload(Cocktail.tags)  # Ładuje tagi; składniki budujemy ręcznie w _build_cocktail_with_details
            )
            .filter(Cocktail.id == cocktail_id)
            .first()
        )
        if not cocktail_orm:
            return None
        return self._build_cocktail_with_details(db, cocktail_orm)

    def get_cocktails(
        self, db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None
    ) -> List[CocktailWithDetails]:
        query_orm = (
            db.query(Cocktail)
            .options(
                joinedload(Cocktail.author),
                selectinload(Cocktail.tags) # Składniki budujemy ręcznie w pętli
            )
        )
        if user_id:
            query_orm = query_orm.filter(Cocktail.user_id == user_id)
        
        cocktails_orm_list = query_orm.order_by(Cocktail.created_at.desc()).offset(skip).limit(limit).all()
        
        # Sprawdź czy lista nie jest pusta przed iteracją
        if not cocktails_orm_list:
            return []
            
        return [self._build_cocktail_with_details(db, cocktail_orm) for cocktail_orm in cocktails_orm_list]


    def create_cocktail(self, db: Session, cocktail_in: CocktailCreate, user_id: int) -> CocktailWithDetails:
        # Sprawdzenie unikalności nazwy koktajlu (jeśli jest globalnie unikalna w modelu)
        # Jeśli constraint jest w bazie, IntegrityError zostanie obsłużony w endpoincie
        # if db.query(Cocktail).filter(Cocktail.name == cocktail_in.name).first():
        #     raise ValueError(f"Koktajl o nazwie '{cocktail_in.name}' już istnieje.")

        db_cocktail_data = cocktail_in.model_dump(exclude={"ingredients", "tags"})
        if cocktail_in.image_url:
            db_cocktail_data['image_url'] = str(cocktail_in.image_url)

        db_cocktail_orm = Cocktail(**db_cocktail_data, user_id=user_id)
        db.add(db_cocktail_orm)
        
        # Zarządzanie tagami (SQLAlchemy zajmie się tabelą asocjacyjną cocktail_tags)
        if cocktail_in.tags:
            for tag_data in cocktail_in.tags:
                tag = db.query(Tag).get(tag_data.tag_id)
                if tag: # Założenie: walidacja istnienia tagu w endpoincie
                    db_cocktail_orm.tags.append(tag)
        
        try:
            # Flush, aby uzyskać ID koktajlu i sprawdzić błędy unikalności przed zapisem składników
            db.flush() 
        except Exception: # Np. IntegrityError (z unikalności nazwy koktajlu)
            db.rollback()
            raise # Rzuć dalej, aby endpoint obsłużył

        # Bezpośrednie zarządzanie tabelą asocjacyjną cocktail_ingredients
        if cocktail_in.ingredients:
            for ing_data in cocktail_in.ingredients: # ing_data to CocktailIngredientData
                # ing_data.amount jest już int, ing_data.unit jest obiektem UnitEnum
                stmt = cocktail_ingredient_association.insert().values(
                    cocktail_id=db_cocktail_orm.id, # Wymaga, aby db_cocktail_orm miał już ID (po flush)
                    ingredient_id=ing_data.ingredient_id,
                    amount=ing_data.amount, # Zapisz int
                    unit=ing_data.unit.value  # Zapisz wartość Enum (string) do bazy
                )
                db.execute(stmt)
        
        db.commit() # Finalny commit
        # db.refresh(db_cocktail_orm) # Może nie być potrzebne, bo get_cocktail() pobierze od nowa
        
        # Zwróć pełny obiekt Pydantic po pomyślnym utworzeniu
        return self.get_cocktail(db, cocktail_id=db_cocktail_orm.id)


    def update_cocktail(
        self, db: Session, db_cocktail_orm: Cocktail, cocktail_in: CocktailUpdate
    ) -> Optional[CocktailWithDetails]:
        update_data = cocktail_in.model_dump(exclude_unset=True)

        # Aktualizacja podstawowych pól koktajlu
        for field, value in update_data.items():
            if field not in ["ingredients", "tags"]: # Pomiń relacje na tym etapie
                setattr(db_cocktail_orm, field, value)
        
        if 'image_url' in update_data and update_data['image_url'] is not None:
            db_cocktail_orm.image_url = str(update_data['image_url'])

        # Aktualizacja składników (z dodatkowymi polami w tabeli asocjacyjnej)
        if "ingredients" in update_data and update_data["ingredients"] is not None:
            # 1. Usuń stare powiązania składników dla tego koktajlu
            db.execute(delete(cocktail_ingredient_association).where(cocktail_ingredient_association.c.cocktail_id == db_cocktail_orm.id))
            # 2. Dodaj nowe powiązania składników
            for ing_data_dict in update_data["ingredients"]: # To jest lista dictów
                try:
                    # Konwertuj dict na model Pydantic dla walidacji (amount: int, unit: Enum)
                    ing_data = CocktailIngredientData(**ing_data_dict)
                except Exception as e: # Np. błąd walidacji Pydantic
                    # Można by tu rzucić ValueError, aby endpoint go obsłużył
                    # lub zalogować i pominąć ten składnik
                    print(f"Błąd walidacji danych składnika podczas aktualizacji: {e} dla {ing_data_dict}")
                    continue # Pomiń niepoprawny składnik

                # Założenie: walidacja istnienia składnika (ingredient_id) w endpoincie
                stmt = cocktail_ingredient_association.insert().values(
                    cocktail_id=db_cocktail_orm.id,
                    ingredient_id=ing_data.ingredient_id,
                    amount=ing_data.amount, # int
                    unit=ing_data.unit.value  # string (wartość Enum)
                )
                db.execute(stmt)
        
        # Aktualizacja tagów (SQLAlchemy zarządza tabelą asocjacyjną)
        if "tags" in update_data and update_data["tags"] is not None:
            db_cocktail_orm.tags.clear() # Usuń wszystkie istniejące powiązania tagów
            for tag_data_obj in update_data["tags"]: # To jest lista dictów lub obiektów Pydantic
                tag_id = getattr(tag_data_obj, 'tag_id', tag_data_obj.get('tag_id') if isinstance(tag_data_obj, dict) else None)
                if tag_id:
                    tag = db.query(Tag).get(tag_id)
                    if tag: # Założenie: walidacja istnienia tagu w endpoincie
                        db_cocktail_orm.tags.append(tag)
        
        try:
            db.commit()
        except Exception: # Np. IntegrityError, jeśli zmiana nazwy koliduje z unikalnością
            db.rollback()
            raise

        # db.refresh(db_cocktail_orm) # Może nie być potrzebne
        return self.get_cocktail(db, cocktail_id=db_cocktail_orm.id)

    def delete_cocktail(self, db: Session, cocktail_id: int) -> Optional[Cocktail]: # Zwraca obiekt ORM
        # .get() jest szybsze dla pobierania po kluczu głównym i nie wymaga .first()
        db_cocktail_orm = db.query(Cocktail).get(cocktail_id)
        if db_cocktail_orm:
            db.delete(db_cocktail_orm)
            db.commit()
            return db_cocktail_orm # Zwraca usunięty obiekt (teraz "detached")
        return None

cocktail = CRUDCocktail()