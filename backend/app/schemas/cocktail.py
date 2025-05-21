from typing import Optional, List, Annotated
from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime
from enum import Enum # <--- NOWY IMPORT

from .user import User as UserSchema
from .ingredient import Ingredient as IngredientSchema
from .tag import Tag as TagSchema

# Krok 1: Zdefiniuj Enum dla jednostek
class UnitEnum(str, Enum):
    ML = "ml"
    L = "l"
    G = "g"
    KG = "kg"
    TSP = "łyżeczka" # teaspoon
    TBSP = "łyżka"   # tablespoon
    OZ = "oz"        # ounce
    SHOT = "shot"
    DASH = "kropla" # dash/kropla
    PIECE = "sztuka" # sztuka/kawałek
    SLICE = "plasterek"
    OTHER = "inna"   # dla niestandardowych

# Schemat danych dla składnika w koktajlu (przy tworzeniu/aktualizacji)
class CocktailIngredientData(BaseModel):
    ingredient_id: int
    amount: int # <--- ZMIANA: str na int
    unit: UnitEnum # <--- ZMIANA: str na UnitEnum

# Schemat danych dla tagu w koktajlu (przy tworzeniu/aktualizacji)
class CocktailTagData(BaseModel):
    tag_id: int

class CocktailBase(BaseModel):
    name: Annotated[str, Field(min_length=3, max_length=100)]
    description: Optional[Annotated[str, Field(max_length=500)]] = None
    instructions: Annotated[str, Field(min_length=10)]
    image_url: Optional[HttpUrl] = None
    is_public: bool = True

class CocktailCreate(CocktailBase):
    ingredients: List[CocktailIngredientData] = []
    tags: List[CocktailTagData] = []

class CocktailUpdate(BaseModel):
    name: Optional[Annotated[str, Field(min_length=3, max_length=100)]] = None
    description: Optional[Annotated[str, Field(max_length=500)]] = None
    instructions: Optional[Annotated[str, Field(min_length=10)]] = None
    image_url: Optional[HttpUrl] = None
    is_public: Optional[bool] = None
    ingredients: Optional[List[CocktailIngredientData]] = None
    tags: Optional[List[CocktailTagData]] = None

class CocktailInDBBase(CocktailBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Cocktail(CocktailInDBBase):
    pass

# Schemat dla składnika zwracanego w szczegółach koktajlu (z amount i unit)
class IngredientInCocktailDetail(IngredientSchema):
    amount: int # <--- ZMIANA: str na int
    unit: UnitEnum # <--- ZMIANA: str na UnitEnum

# Schemat odpowiedzi dla koktajlu z pełnymi szczegółami
class CocktailWithDetails(CocktailInDBBase):
    author: UserSchema
    ingredients: List[IngredientInCocktailDetail] = []
    tags: List[TagSchema] = []