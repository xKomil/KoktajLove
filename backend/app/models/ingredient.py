from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base
# Import tabeli asocjacyjnej z modelu cocktail
# from .cocktail import cocktail_ingredient_association # Usunięte, bo powoduje cykliczny import

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    # Relacja zdefiniowana w cocktail.py przez `secondary=cocktail_ingredient_association`
    cocktails = relationship(
        "Cocktail",
        secondary="cocktail_ingredients", # Nazwa tabeli jako string
        back_populates="ingredients"
    )