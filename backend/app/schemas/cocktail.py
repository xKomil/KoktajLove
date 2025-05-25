# backend/app/schemas/cocktail.py (fragmenty do aktualizacji)

from typing import Optional, List, Union, Dict, Any
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from enum import Enum

from app.schemas.user import User as UserSchema
from app.schemas.tag import Tag as TagSchema

class UnitEnum(str, Enum):
    ML = "ml"
    L = "l"
    OZ = "oz"
    TSP = "tsp"
    TBSP = "tbsp"
    CUP = "cup"
    PIECE = "piece"
    DASH = "dash"
    DROP = "drop"
    OTHER = "other"

class IngredientInCocktailDetail(BaseModel):
    id: int
    name: str
    amount: int
    unit: UnitEnum

class CocktailIngredientData(BaseModel):
    ingredient_id: int
    amount: int
    unit: UnitEnum

class CocktailTagData(BaseModel):
    tag_id: int

# Podstawowy schemat koktajlu
class CocktailBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    instructions: str = Field(..., min_length=1)
    image_url: Optional[HttpUrl] = None
    is_public: bool = True

class CocktailCreate(CocktailBase):
    ingredients: List[CocktailIngredientData] = Field(..., min_length=1)
    tags: Optional[List[CocktailTagData]] = None

class CocktailUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    instructions: Optional[str] = Field(None, min_length=1)
    image_url: Optional[HttpUrl] = None
    is_public: Optional[bool] = None
    ingredients: Optional[List[CocktailIngredientData]] = None
    tags: Optional[List[CocktailTagData]] = None

# Schemat podstawowego koktajlu (dla prostych odpowiedzi)
class Cocktail(CocktailBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

# ZAKTUALIZOWANY schemat z detalami koktajlu - ZAWIERA ŚREDNIĄ OCENĘ
class CocktailWithDetails(CocktailBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: UserSchema
    ingredients: List[IngredientInCocktailDetail]
    tags: List[TagSchema]
    # NOWE POLA - średnia ocena i liczba ocen
    average_rating: Optional[float] = Field(default=None, description="Średnia ocena koktajlu")
    ratings_count: int = Field(default=0, description="Liczba ocen dla koktajlu")
    
    model_config = {"from_attributes": True}

# Schemat odpowiedzi z paginacją
class PaginatedCocktailResponse(BaseModel):
    items: List[CocktailWithDetails]
    total: int
    page: int
    size: int
    pages: int