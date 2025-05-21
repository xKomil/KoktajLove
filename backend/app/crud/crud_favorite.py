from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.favorite import Favorite
from app.schemas.favorite import FavoriteCreate

class CRUDFavorite:
    def get_favorite(self, db: Session, user_id: int, cocktail_id: int) -> Optional[Favorite]:
        return db.query(Favorite).filter(
            Favorite.user_id == user_id,
            Favorite.cocktail_id == cocktail_id
        ).first()

    def get_user_favorites(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Favorite]:
        return db.query(Favorite).filter(Favorite.user_id == user_id).offset(skip).limit(limit).all()

    def create_favorite(self, db: Session, favorite_in: FavoriteCreate, user_id: int) -> Favorite:
        existing_favorite = self.get_favorite(db, user_id, favorite_in.cocktail_id)
        if existing_favorite:
            # Już istnieje, można zwrócić istniejący lub rzucić błąd
            return existing_favorite # lub raise ValueError("Already favorited")

        db_favorite = Favorite(
            user_id=user_id,
            cocktail_id=favorite_in.cocktail_id
        )
        db.add(db_favorite)
        db.commit()
        db.refresh(db_favorite)
        return db_favorite

    def delete_favorite(self, db: Session, user_id: int, cocktail_id: int) -> Optional[Favorite]:
        db_favorite = self.get_favorite(db, user_id, cocktail_id)
        if db_favorite:
            db.delete(db_favorite)
            db.commit()
            return db_favorite
        return None

favorite = CRUDFavorite()