from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True) # Lub można użyć (user_id, cocktail_id) jako klucz główny
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cocktail_id = Column(Integer, ForeignKey("cocktails.id"), nullable=False)

    user = relationship("User", back_populates="favorites")
    cocktail = relationship("Cocktail", back_populates="favorited_by")