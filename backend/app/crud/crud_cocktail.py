from typing import Optional, List, Union
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import select, delete, insert

from app.models.cocktail import Cocktail, cocktail_ingredient_association, cocktail_tag_association
from app.models.ingredient import Ingredient
from app.models.tag import Tag
from app.models.user import User # Potrzebne do typowania autora
from app.schemas.cocktail import CocktailCreate, CocktailUpdate, CocktailIngredientData, CocktailTagData

class CRUDCocktail:
    def get_cocktail(self, db: Session, cocktail_id: int) -> Optional[Cocktail]:
        """
        Pobiera pojedynczy koktajl wraz z autorem, składnikami i tagami.
        """
        return (
            db.query(Cocktail)
            .options(
                joinedload(Cocktail.author), # Eager load autora
                selectinload(Cocktail.ingredients_association).joinedload(cocktail_ingredient_association.c.ingredient), # Eager load składników
                selectinload(Cocktail.tags_association).joinedload(cocktail_tag_association.c.tag) # Eager load tagów
            )
            .filter(Cocktail.id == cocktail_id)
            .first()
        )

    def get_cocktails(
        self, db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None
    ) -> List[Cocktail]:
        """
        Pobiera listę koktajli, opcjonalnie filtrując po user_id.
        Ładuje autora, składniki i tagi.
        """
        query = db.query(Cocktail).options(
            joinedload(Cocktail.author),
            selectinload(Cocktail.ingredients_association).joinedload(cocktail_ingredient_association.c.ingredient),
            selectinload(Cocktail.tags_association).joinedload(cocktail_tag_association.c.tag)
        )
        if user_id:
            query = query.filter(Cocktail.user_id == user_id)
        return query.order_by(Cocktail.created_at.desc()).offset(skip).limit(limit).all()

    def create_cocktail(self, db: Session, cocktail_in: CocktailCreate, user_id: int) -> Cocktail:
        """
        Tworzy nowy koktajl i powiązania ze składnikami oraz tagami.
        """
        db_cocktail_data = cocktail_in.model_dump(exclude={"ingredients", "tags"})
        if cocktail_in.image_url: # Pydantic v2 zwraca obiekt HttpUrl
            db_cocktail_data['image_url'] = str(cocktail_in.image_url)

        db_cocktail = Cocktail(**db_cocktail_data, user_id=user_id)
        db.add(db_cocktail)
        db.commit()  # Commit, aby uzyskać ID koktajlu dla tabel asocjacyjnych

        # Dodawanie składników
        if cocktail_in.ingredients:
            for ing_data in cocktail_in.ingredients:
                # Sprawdzenie czy składnik istnieje jest w gestii endpointu
                stmt = cocktail_ingredient_association.insert().values(
                    cocktail_id=db_cocktail.id,
                    ingredient_id=ing_data.ingredient_id,
                    amount=ing_data.amount,
                    unit=ing_data.unit
                )
                db.execute(stmt)

        # Dodawanie tagów
        if cocktail_in.tags:
            for tag_data in cocktail_in.tags:
                # Sprawdzenie czy tag istnieje jest w gestii endpointu
                stmt = cocktail_tag_association.insert().values(
                    cocktail_id=db_cocktail.id,
                    tag_id=tag_data.tag_id
                )
                db.execute(stmt)
        
        db.commit() # Commit po dodaniu powiązań
        # Odświeżenie obiektu, aby załadować nowe relacje (może nie być konieczne z selectinload/joinedload)
        # db.refresh(db_cocktail)
        # Lepiej pobrać ponownie obiekt z pełnym załadowaniem relacji dla spójności odpowiedzi
        return self.get_cocktail(db, cocktail_id=db_cocktail.id)


    def update_cocktail(
        self, db: Session, db_cocktail: Cocktail, cocktail_in: Union[CocktailUpdate, dict]
    ) -> Optional[Cocktail]:
        """
        Aktualizuje istniejący koktajl, w tym jego składniki i tagi.
        """
        if isinstance(cocktail_in, dict):
            update_data = cocktail_in
        else:
            update_data = cocktail_in.model_dump(exclude_unset=True)

        # Aktualizacja podstawowych pól koktajlu
        for field, value in update_data.items():
            if field not in ["ingredients", "tags"]: # Pomijamy relacje na tym etapie
                setattr(db_cocktail, field, value)
        
        if 'image_url' in update_data and update_data['image_url'] is not None: # Pydantic v2 zwraca HttpUrl
            db_cocktail.image_url = str(update_data['image_url'])


        # Aktualizacja składników
        if "ingredients" in update_data and update_data["ingredients"] is not None:
            # Usunięcie starych powiązań składników
            db.execute(delete(cocktail_ingredient_association).where(cocktail_ingredient_association.c.cocktail_id == db_cocktail.id))
            # Dodanie nowych powiązań składników
            for ing_data_dict in update_data["ingredients"]:
                ing_data = CocktailIngredientData(**ing_data_dict) # Konwersja dict na Pydantic model
                # Sprawdzenie czy składnik istnieje jest w gestii endpointu
                stmt = cocktail_ingredient_association.insert().values(
                    cocktail_id=db_cocktail.id,
                    ingredient_id=ing_data.ingredient_id,
                    amount=ing_data.amount,
                    unit=ing_data.unit
                )
                db.execute(stmt)

        # Aktualizacja tagów
        if "tags" in update_data and update_data["tags"] is not None:
            # Usunięcie starych powiązań tagów
            db.execute(delete(cocktail_tag_association).where(cocktail_tag_association.c.cocktail_id == db_cocktail.id))
            # Dodanie nowych powiązań tagów
            for tag_data_dict in update_data["tags"]:
                tag_data = CocktailTagData(**tag_data_dict) # Konwersja dict na Pydantic model
                # Sprawdzenie czy tag istnieje jest w gestii endpointu
                stmt = cocktail_tag_association.insert().values(
                    cocktail_id=db_cocktail.id,
                    tag_id=tag_data.tag_id
                )
                db.execute(stmt)

        db.add(db_cocktail) # Dodaj zmiany do sesji
        db.commit()
        # db.refresh(db_cocktail) # Odśwież obiekt
        return self.get_cocktail(db, cocktail_id=db_cocktail.id) # Pobierz ponownie dla spójności


    def delete_cocktail(self, db: Session, cocktail_id: int) -> Optional[Cocktail]:
        """
        Usuwa koktajl z bazy danych.
        Relacje kaskadowe (ratings, favorites) powinny być usunięte automatycznie przez bazę.
        Powiązania w tabelach asocjacyjnych (ingredients, tags) też dzięki ondelete="CASCADE".
        """
        db_cocktail = db.query(Cocktail).get(cocktail_id) # Użyj .get() dla klucza głównego
        if db_cocktail:
            # Zanim usuniesz, pobierz pełne dane, jeśli chcesz je zwrócić
            # (choć typowo DELETE zwraca 204 No Content lub usunięty obiekt bez relacji)
            # full_cocktail_data = self.get_cocktail(db, cocktail_id) # Jeśli chcesz zwrócić pełny obiekt

            db.delete(db_cocktail)
            db.commit()
            return db_cocktail # Zwraca usunięty obiekt (może być bez niektórych eager-loaded relacji po usunięciu)
        return None

cocktail = CRUDCocktail()