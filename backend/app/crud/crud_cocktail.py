from typing import Optional, List, Union
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import select, delete

# Importy modeli
from app.models.cocktail import Cocktail, cocktail_ingredient_association, cocktail_tag_association
from app.models.ingredient import Ingredient
from app.models.tag import Tag
from app.models.user import User

# Importy schematów
from app.schemas.cocktail import (
    CocktailCreate, CocktailUpdate, CocktailIngredientData, CocktailTagData,
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
                cocktail_ingredient_association.c.amount, # To już będzie int z bazy
                cocktail_ingredient_association.c.unit   # To będzie string z bazy
            )
            .join_from(cocktail_ingredient_association, Ingredient, cocktail_ingredient_association.c.ingredient_id == Ingredient.id)
            .where(cocktail_ingredient_association.c.cocktail_id == cocktail_orm.id)
        )
        
        for row in db.execute(stmt_ing).all():
            try:
                # Konwertuj string z bazy na UnitEnum
                # Jeśli wartość z bazy nie pasuje do Enum, Pydantic rzuci błąd walidacji
                # Można dodać obsługę błędów tutaj, jeśli potrzebne jest bardziej "miękkie" podejście
                unit_enum_value = UnitEnum(row.unit)
            except ValueError:
                # Jeśli jednostka z bazy nie jest poprawnym Enumem,
                # możesz ustawić domyślną, zalogować błąd, lub pominąć ten składnik.
                # Dla przykładu, ustawiamy na 'inna' jeśli nie pasuje.
                # W praktyce, dane w bazie powinny być spójne z Enum.
                unit_enum_value = UnitEnum.OTHER
                print(f"Warning: Invalid unit '{row.unit}' for cocktail ID {cocktail_orm.id}, ingredient ID {row.id}. Defaulting to '{UnitEnum.OTHER.value}'.")


            ingredients_details.append(IngredientInCocktailDetail(
                id=row.id, 
                name=row.name, 
                amount=row.amount, # Już jest int
                unit=unit_enum_value
            ))

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
        self, db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None
    ) -> List[CocktailWithDetails]:
        query_orm = (
            db.query(Cocktail)
            .options(
                joinedload(Cocktail.author),
                selectinload(Cocktail.tags)
            )
        )
        if user_id:
            query_orm = query_orm.filter(Cocktail.user_id == user_id)
        
        cocktails_orm_list = query_orm.order_by(Cocktail.created_at.desc()).offset(skip).limit(limit).all()
        
        return [self._build_cocktail_with_details(db, cocktail_orm) for cocktail_orm in cocktails_orm_list if cocktail_orm]


    def create_cocktail(self, db: Session, cocktail_in: CocktailCreate, user_id: int) -> CocktailWithDetails:
        db_cocktail_data = cocktail_in.model_dump(exclude={"ingredients", "tags"})
        if cocktail_in.image_url:
            db_cocktail_data['image_url'] = str(cocktail_in.image_url)

        db_cocktail_orm = Cocktail(**db_cocktail_data, user_id=user_id)
        db.add(db_cocktail_orm)
        
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

        if cocktail_in.ingredients:
            for ing_data in cocktail_in.ingredients: # ing_data.amount jest int, ing_data.unit jest UnitEnum
                stmt = cocktail_ingredient_association.insert().values(
                    cocktail_id=db_cocktail_orm.id,
                    ingredient_id=ing_data.ingredient_id,
                    amount=ing_data.amount, # Zapisz int
                    unit=ing_data.unit.value  # Zapisz wartość Enum (string) do bazy
                )
                db.execute(stmt)
        
        db.commit()
        return self.get_cocktail(db, cocktail_id=db_cocktail_orm.id)


    def update_cocktail(
        self, db: Session, db_cocktail_orm: Cocktail, cocktail_in: CocktailUpdate
    ) -> Optional[CocktailWithDetails]:
        update_data = cocktail_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if field not in ["ingredients", "tags"]:
                setattr(db_cocktail_orm, field, value)
        
        if 'image_url' in update_data and update_data['image_url'] is not None:
            db_cocktail_orm.image_url = str(update_data['image_url'])

        if "ingredients" in update_data and update_data["ingredients"] is not None:
            db.execute(delete(cocktail_ingredient_association).where(cocktail_ingredient_association.c.cocktail_id == db_cocktail_orm.id))
            for ing_data_dict in update_data["ingredients"]:
                ing_data = CocktailIngredientData(**ing_data_dict) # Pydantic skonwertuje input na int i UnitEnum
                stmt = cocktail_ingredient_association.insert().values(
                    cocktail_id=db_cocktail_orm.id,
                    ingredient_id=ing_data.ingredient_id,
                    amount=ing_data.amount, # Zapisz int
                    unit=ing_data.unit.value  # Zapisz wartość Enum (string)
                )
                db.execute(stmt)
        
        if "tags" in update_data and update_data["tags"] is not None:
            db_cocktail_orm.tags.clear()
            for tag_data_obj in update_data["tags"]:
                tag_id = tag_data_obj.tag_id if hasattr(tag_data_obj, 'tag_id') else tag_data_obj.get('tag_id')
                if tag_id:
                    tag = db.query(Tag).get(tag_id)
                    if tag:
                        db_cocktail_orm.tags.append(tag)
        
        db.commit()
        return self.get_cocktail(db, cocktail_id=db_cocktail_orm.id)

    # delete_cocktail pozostaje bez zmian, ponieważ zwraca prostszy schemat Cocktail
    def delete_cocktail(self, db: Session, cocktail_id: int) -> Optional[Cocktail]:
        db_cocktail_orm = db.query(Cocktail).options(joinedload(Cocktail.author)).get(cocktail_id)
        if db_cocktail_orm:
            db.delete(db_cocktail_orm)
            db.commit()
            return db_cocktail_orm
        return None

cocktail = CRUDCocktail()