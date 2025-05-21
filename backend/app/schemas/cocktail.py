from typing import Optional, List
from pydantic import BaseModel, HttpUrl
from datetime import datetime

from .ingredient import Ingredient # Zakładam, że schemas/ingredient.py definiuje Ingredient
from .tag import Tag # Zakładam, że schemas/tag.py definiuje Tag
from .user import User as UserSchema # Zakładam, że schemas/user.py definiuje User, używamy aliasu UserSchema

class CocktailIngredientLink(BaseModel): # Do tworzenia/aktualizacji
    ingredient_id: int
    amount: str
    unit: str

    class Config:
        from_attributes = True

class CocktailTagLink(BaseModel): # Do tworzenia/aktualizacji
    tag_id: int

    class Config:
        from_attributes = True


class CocktailBase(BaseModel):
    name: str
    description: Optional[str] = None
    instructions: str
    image_url: Optional[HttpUrl] = None
    is_public: bool = True

class CocktailCreate(CocktailBase):
    ingredients: List[CocktailIngredientLink] = []
    tags: List[CocktailTagLink] = []

class CocktailUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    image_url: Optional[HttpUrl] = None
    is_public: Optional[bool] = None
    ingredients: Optional[List[CocktailIngredientLink]] = None
    tags: Optional[List[CocktailTagLink]] = None


class CocktailInDBBase(CocktailBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Cocktail(CocktailInDBBase): # Podstawowy schemat odpowiedzi bez szczegółów relacji
    pass

# Schemat składnika używany w CocktailWithDetails
class IngredientInCocktail(Ingredient):
    amount: str
    unit: str
  

class CocktailWithDetails(Cocktail):
    author: UserSchema
    ingredients: List[IngredientInCocktail] = []
    tags: List[Tag] = []