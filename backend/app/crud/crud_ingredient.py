from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.ingredient import Ingredient
from app.schemas.ingredient import IngredientCreate, IngredientUpdate

class CRUDIngredient:
    def get_ingredient(self, db: Session, ingredient_id: int) -> Optional[Ingredient]:
        return db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()

    def get_ingredient_by_name(self, db: Session, name: str) -> Optional[Ingredient]:
        return db.query(Ingredient).filter(Ingredient.name == name).first()

    def get_ingredients(self, db: Session, skip: int = 0, limit: int = 100) -> List[Ingredient]:
        return db.query(Ingredient).offset(skip).limit(limit).all()

    def create_ingredient(self, db: Session, ingredient_in: IngredientCreate) -> Ingredient:
        db_ingredient = Ingredient(name=ingredient_in.name)
        db.add(db_ingredient)
        db.commit()
        db.refresh(db_ingredient)
        return db_ingredient

    def update_ingredient(
        self, db: Session, db_ingredient: Ingredient, ingredient_in: IngredientUpdate
    ) -> Ingredient:
        if ingredient_in.name is not None:
            db_ingredient.name = ingredient_in.name
        db.add(db_ingredient)
        db.commit()
        db.refresh(db_ingredient)
        return db_ingredient

    def delete_ingredient(self, db: Session, ingredient_id: int) -> Optional[Ingredient]:
        db_ingredient = self.get_ingredient(db, ingredient_id)
        if db_ingredient:
            # Należy rozważyć, co zrobić, jeśli składnik jest używany w koktajlach
            # Domyślnie ForeignKey ondelete="RESTRICT" w cocktail_ingredients
            # uniemożliwi usunięcie, jeśli składnik jest używany.
            # Można dodać logikę sprawdzającą lub zmienić strategię ondelete.
            try:
                db.delete(db_ingredient)
                db.commit()
                return db_ingredient
            except Exception as e: # Np. IntegrityError
                db.rollback()
                # Można tutaj rzucić własny wyjątek lub zwrócić None/False
                print(f"Error deleting ingredient: {e}")
                return None
        return None


ingredient = CRUDIngredient()