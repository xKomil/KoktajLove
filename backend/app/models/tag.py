from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base
# from .cocktail import cocktail_tag_association # Usunięte, bo powoduje cykliczny import

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    cocktails = relationship(
        "Cocktail",
        secondary="cocktail_tags", # Nazwa tabeli jako string
        back_populates="tags"
    )