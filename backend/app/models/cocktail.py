from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

cocktail_ingredient_association = Table(
    'cocktail_ingredients', Base.metadata,
    Column('cocktail_id', Integer, ForeignKey('cocktails.id', ondelete="CASCADE"), primary_key=True),
    Column('ingredient_id', Integer, ForeignKey('ingredients.id', ondelete="RESTRICT"), primary_key=True),
    Column('amount', Integer, nullable=False),
    Column('unit', String(50), nullable=False)
)

cocktail_tag_association = Table(
    'cocktail_tags', Base.metadata,
    Column('cocktail_id', Integer, ForeignKey('cocktails.id', ondelete="CASCADE"), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete="RESTRICT"), primary_key=True)
)

class Cocktail(Base):
    __tablename__ = "cocktails"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False, unique=True) # Zakładam, że unikalność nazwy pozostała
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author = relationship("User", back_populates="cocktails")

    ingredients = relationship(
        "Ingredient", # Nazwa klasy modelu Ingredient
        secondary=cocktail_ingredient_association,
        back_populates="cocktails" # Nazwa relacji w modelu Ingredient
    )
    
    tags = relationship(
        "Tag", # Nazwa klasy modelu Tag
        secondary=cocktail_tag_association,
        back_populates="cocktails" # Nazwa relacji w modelu Tag
    )
    
    ratings = relationship("Rating", back_populates="cocktail", cascade="all, delete-orphan")
    favorited_by = relationship("Favorite", back_populates="cocktail", cascade="all, delete-orphan")