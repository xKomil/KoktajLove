# backend\app\models\rating.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    rating_value = Column(Integer, nullable=False)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cocktail_id = Column(Integer, ForeignKey("cocktails.id"), nullable=False)

    user = relationship("User", back_populates="ratings")
    cocktail = relationship("Cocktail", back_populates="ratings")

    __table_args__ = (
        CheckConstraint('rating_value >= 1 AND rating_value <= 5', name='rating_value_check'),
    )