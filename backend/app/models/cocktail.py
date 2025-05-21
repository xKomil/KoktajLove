from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

cocktail_ingredient_association = Table(
    'cocktail_ingredients', Base.metadata,
    Column('cocktail_id', Integer, ForeignKey('cocktails.id', ondelete="CASCADE"), primary_key=True),
    Column('ingredient_id', Integer, ForeignKey('ingredients.id', ondelete="RESTRICT"), primary_key=True),
    Column('amount', String, nullable=False),
    Column('unit', String, nullable=False)
)

cocktail_tag_association = Table(
    'cocktail_tags', Base.metadata,
    Column('cocktail_id', Integer, ForeignKey('cocktails.id', ondelete="CASCADE"), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete="RESTRICT"), primary_key=True)
)

class Cocktail(Base):
    __tablename__ = "cocktails"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author = relationship("User", back_populates="cocktails")

    ingredients = relationship(
        "Ingredient",
        secondary=cocktail_ingredient_association,
        back_populates="cocktails"
    )
    tags = relationship(
        "Tag",
        secondary=cocktail_tag_association,
        back_populates="cocktails"
    )
    ratings = relationship("Rating", back_populates="cocktail", cascade="all, delete-orphan")
    favorited_by = relationship("Favorite", back_populates="cocktail", cascade="all, delete-orphan")