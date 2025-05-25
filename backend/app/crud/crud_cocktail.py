#\backend\app\crud\crud_cocktail.py
from typing import Optional, List, Union, Dict, Any
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import select, delete, and_, distinct, func
import math

# Importy modeli
from app.models.cocktail import Cocktail, cocktail_ingredient_association, cocktail_tag_association
from app.models.ingredient import Ingredient
from app.models.tag import Tag
from app.models.user import User

# Importy schematów
from app.schemas.cocktail import (
    CocktailCreate, CocktailUpdate, CocktailIngredientData,
    CocktailWithDetails, IngredientInCocktailDetail, UnitEnum 
)
from app.schemas.user import User as UserSchema
from app.schemas.tag import Tag as TagSchema

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
                unit_enum_value = UnitEnum(row.unit)
            except ValueError:
                unit_enum_value = UnitEnum.OTHER
                print(f"WARNING: Invalid unit '{row.unit}' found in DB for cocktail ID {cocktail_orm.id}, ingredient ID {row.id}. Defaulting to '{UnitEnum.OTHER.value}'.")

            ingredients_details.append(IngredientInCocktailDetail(
                id=row.id, 
                name=row.name, 
                amount=row.amount,
                unit=unit_enum_value
            ))

        if not cocktail_orm.author:
            db.refresh(cocktail_orm, ['author'])
        if not hasattr(cocktail_orm, 'tags') or not cocktail_orm.tags:
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
                joinedload(Cocktail.author),
                selectinload(Cocktail.tags)
            )
            .filter(Cocktail.id == cocktail_id)
            .first()
        )
        if not cocktail_orm:
            return None
        return self._build_cocktail_with_details(db, cocktail_orm)

    def get_cocktails(
        self, 
        db: Session, 
        name: Optional[str] = None,
        ingredient_ids: Optional[List[int]] = None,
        tag_ids: Optional[List[int]] = None,
        page: int = 1,
        size: int = 12,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Pobiera koktajle z filtrowaniem i paginacją.
        
        Args:
            db: Sesja bazy danych
            name: Nazwa koktajlu (częściowe dopasowanie, nieczułe na wielkość liter)
            ingredient_ids: Lista ID składników (koktajl musi zawierać WSZYSTKIE)
            tag_ids: Lista ID tagów (koktajl musi zawierać WSZYSTKIE)
            page: Numer strony (zaczyna od 1)
            size: Liczba elementów na stronie
            user_id: ID użytkownika (opcjonalne filtrowanie po prywatnych koktajlach)
            
        Returns:
            Dict zawierający items, total, page, size, pages
        """
        
        # Bazowe zapytanie z joinami dla optymalizacji
        base_query = (
            db.query(Cocktail)
            .options(
                joinedload(Cocktail.author),
                selectinload(Cocktail.tags)
            )
        )
        
        # Filtr publiczności - jeśli nie ma user_id, pokaż tylko publiczne
        if user_id is None:
            base_query = base_query.filter(Cocktail.is_public == True)
        else:
            # Jeśli jest user_id, pokaż publiczne + prywatne tego użytkownika
            base_query = base_query.filter(
                (Cocktail.is_public == True) | (Cocktail.user_id == user_id)
            )
        
        # Filtrowanie po nazwie
        if name and name.strip():
            base_query = base_query.filter(
                Cocktail.name.ilike(f"%{name.strip()}%")
            )
        
        # Filtrowanie po składnikach - koktajl musi zawierać WSZYSTKIE podane składniki
        if ingredient_ids and len(ingredient_ids) > 0:
            # Używamy subquery z GROUP BY i HAVING
            ingredient_subquery = (
                db.query(cocktail_ingredient_association.c.cocktail_id)
                .filter(cocktail_ingredient_association.c.ingredient_id.in_(ingredient_ids))
                .group_by(cocktail_ingredient_association.c.cocktail_id)
                .having(func.count(distinct(cocktail_ingredient_association.c.ingredient_id)) == len(ingredient_ids))
                .subquery()
            )
            base_query = base_query.filter(Cocktail.id.in_(
                select(ingredient_subquery.c.cocktail_id)
            ))
        
        # Filtrowanie po tagach - koktajl musi zawierać WSZYSTKIE podane tagi
        if tag_ids and len(tag_ids) > 0:
            # Analogicznie do składników
            tag_subquery = (
                db.query(cocktail_tag_association.c.cocktail_id)
                .filter(cocktail_tag_association.c.tag_id.in_(tag_ids))
                .group_by(cocktail_tag_association.c.cocktail_id)
                .having(func.count(distinct(cocktail_tag_association.c.tag_id)) == len(tag_ids))
                .subquery()
            )
            base_query = base_query.filter(Cocktail.id.in_(
                select(tag_subquery.c.cocktail_id)
            ))
        
        # Oblicz całkowitą liczbę wyników (przed paginacją)
        total_count = base_query.count()
        
        # Oblicz liczbę stron
        total_pages = math.ceil(total_count / size) if total_count > 0 else 1
        
        # Zastosuj paginację
        skip = (page - 1) * size
        cocktails_orm_list = (
            base_query
            .order_by(Cocktail.created_at.desc())
            .offset(skip)
            .limit(size)
            .all()
        )
        
        # Przekształć na CocktailWithDetails
        cocktail_details_list = []
        if cocktails_orm_list:
            cocktail_details_list = [
                self._build_cocktail_with_details(db, cocktail_orm) 
                for cocktail_orm in cocktails_orm_list
                if cocktail_orm is not None
            ]
            
        print(f"--- CRUD get_cocktails RECEIVED ---")
        print(f"Name: {name}")
        print(f"Ingredient IDs: {ingredient_ids}") # <--- WAŻNE
        print(f"Tag IDs: {tag_ids}")             # <--- WAŻNE
        print(f"Page: {page}, Size: {size}")
        print(f"User ID: {user_id}")
        
        return {
            "items": cocktail_details_list,
            "total": total_count,
            "page": page,
            "size": size,
            "pages": total_pages
        }

    def create_cocktail(self, db: Session, cocktail_in: CocktailCreate, user_id: int) -> CocktailWithDetails:
        db_cocktail_data = cocktail_in.model_dump(exclude={"ingredients", "tags"})
        if cocktail_in.image_url:
            db_cocktail_data['image_url'] = str(cocktail_in.image_url)

        db_cocktail_orm = Cocktail(**db_cocktail_data, user_id=user_id)
        db.add(db_cocktail_orm)
        
        # Zarządzanie tagami
        if cocktail_in.tags:
            for tag_data in cocktail_in.tags:
                tag = db.query(Tag).get(tag_data.tag_id)
                if tag:
                    db_cocktail_orm.tags.append(tag)
        
        try:
            db.flush()
        except Exception:
            db.rollback()
            raise

        # Zarządzanie składnikami
        if cocktail_in.ingredients:
            for ing_data in cocktail_in.ingredients:
                stmt = cocktail_ingredient_association.insert().values(
                    cocktail_id=db_cocktail_orm.id,
                    ingredient_id=ing_data.ingredient_id,
                    amount=ing_data.amount,
                    unit=ing_data.unit.value
                )
                db.execute(stmt)
        
        db.commit()
        return self.get_cocktail(db, cocktail_id=db_cocktail_orm.id)

    def update_cocktail(
        self, db: Session, db_cocktail_orm: Cocktail, cocktail_in: CocktailUpdate
    ) -> Optional[CocktailWithDetails]:
        update_data = cocktail_in.model_dump(exclude_unset=True)

        # Aktualizacja podstawowych pól
        for field, value in update_data.items():
            if field not in ["ingredients", "tags"]:
                setattr(db_cocktail_orm, field, value)
        
        if 'image_url' in update_data and update_data['image_url'] is not None:
            db_cocktail_orm.image_url = str(update_data['image_url'])

        # Aktualizacja składników
        if "ingredients" in update_data and update_data["ingredients"] is not None:
            db.execute(delete(cocktail_ingredient_association).where(cocktail_ingredient_association.c.cocktail_id == db_cocktail_orm.id))
            for ing_data_dict in update_data["ingredients"]:
                try:
                    ing_data = CocktailIngredientData(**ing_data_dict)
                except Exception as e:
                    print(f"Błąd walidacji danych składnika podczas aktualizacji: {e} dla {ing_data_dict}")
                    continue

                stmt = cocktail_ingredient_association.insert().values(
                    cocktail_id=db_cocktail_orm.id,
                    ingredient_id=ing_data.ingredient_id,
                    amount=ing_data.amount,
                    unit=ing_data.unit.value
                )
                db.execute(stmt)
        
        # Aktualizacja tagów
        if "tags" in update_data and update_data["tags"] is not None:
            db_cocktail_orm.tags.clear()
            for tag_data_obj in update_data["tags"]:
                tag_id = getattr(tag_data_obj, 'tag_id', tag_data_obj.get('tag_id') if isinstance(tag_data_obj, dict) else None)
                if tag_id:
                    tag = db.query(Tag).get(tag_id)
                    if tag:
                        db_cocktail_orm.tags.append(tag)
        
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise

        return self.get_cocktail(db, cocktail_id=db_cocktail_orm.id)

    def delete_cocktail(self, db: Session, cocktail_id: int) -> Optional[Cocktail]:
        db_cocktail_orm = db.query(Cocktail).get(cocktail_id)
        if db_cocktail_orm:
            db.delete(db_cocktail_orm)
            db.commit()
            return db_cocktail_orm
        return None

cocktail = CRUDCocktail()