from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.rating import Rating
from app.schemas.rating import RatingCreate, RatingUpdate

class CRUDRating:
    def get_rating(self, db: Session, rating_id: int) -> Optional[Rating]:
        return db.query(Rating).filter(Rating.id == rating_id).first()

    def get_ratings_for_cocktail(self, db: Session, cocktail_id: int, skip: int = 0, limit: int = 100) -> List[Rating]:
        return db.query(Rating).filter(Rating.cocktail_id == cocktail_id).offset(skip).limit(limit).all()

    def get_ratings_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Rating]:
        return db.query(Rating).filter(Rating.user_id == user_id).offset(skip).limit(limit).all()

    def create_rating(self, db: Session, rating_in: RatingCreate, user_id: int) -> Rating:
        # Sprawdź, czy użytkownik już ocenił ten koktajl
        existing_rating = db.query(Rating).filter(
            Rating.user_id == user_id,
            Rating.cocktail_id == rating_in.cocktail_id
        ).first()
        if existing_rating:
            # Można zdecydować się na aktualizację istniejącej oceny lub rzucenie błędu
            # Tutaj rzucamy błąd (lub można zwrócić None/podnieść HTTPException w endpoint)
            raise ValueError("User has already rated this cocktail.") # lub return None

        db_rating = Rating(
            **rating_in.model_dump(),
            user_id=user_id
        )
        db.add(db_rating)
        db.commit()
        db.refresh(db_rating)
        return db_rating

    def update_rating(self, db: Session, db_rating: Rating, rating_in: RatingUpdate) -> Rating:
        update_data = rating_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_rating, field, value)
        db.add(db_rating)
        db.commit()
        db.refresh(db_rating)
        return db_rating

    def delete_rating(self, db: Session, rating_id: int) -> Optional[Rating]:
        db_rating = self.get_rating(db, rating_id)
        if db_rating:
            db.delete(db_rating)
            db.commit()
        return db_rating

rating = CRUDRating()