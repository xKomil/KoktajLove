from typing import Optional, List, Annotated
from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime

# Importuj uproszczone schematy dla zagnieżdżonych obiektów
from .user import User as UserSchema # Zmieniono nazwę importu, aby uniknąć konfliktu z modelem User
from .ingredient import Ingredient as IngredientSchema
from .tag import Tag as TagSchema


# Schemat danych dla składnika w koktajlu (przy tworzeniu/aktualizacji)
class CocktailIngredientData(BaseModel):
    ingredient_id: int
    amount: str
    unit: str

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
    # Lista obiektów definiujących składniki i ich ilości
    ingredients: List[CocktailIngredientData] = []
    # Lista obiektów definiujących tagi
    tags: List[CocktailTagData] = []

class CocktailUpdate(BaseModel): # Wszystkie pola opcjonalne
    name: Optional[Annotated[str, Field(min_length=3, max_length=100)]] = None
    description: Optional[Annotated[str, Field(max_length=500)]] = None
    instructions: Optional[Annotated[str, Field(min_length=10)]] = None
    image_url: Optional[HttpUrl] = None
    is_public: Optional[bool] = None
    ingredients: Optional[List[CocktailIngredientData]] = None
    tags: Optional[List[CocktailTagData]] = None


class CocktailInDBBase(CocktailBase):
    id: int
    user_id: int # ID autora
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Pydantic v2, orm_mode w v1

# Podstawowy schemat odpowiedzi dla koktajlu
class Cocktail(CocktailInDBBase):
    pass

# Schemat dla składnika zwracanego w szczegółach koktajlu
class IngredientInCocktailDetail(IngredientSchema): # Dziedziczy z pełnego schematu Ingredient
    amount: str
    unit: str

# Schemat odpowiedzi dla koktajlu z pełnymi szczegółami
# (autor, składniki z ilościami, tagi)
class CocktailWithDetails(CocktailInDBBase): # Dziedziczy z CocktailInDBBase, aby mieć wszystkie jego pola
    author: UserSchema # Pełny schemat użytkownika (autora)
    # Lista pełnych obiektów składników wraz z ilością i jednostką
    ingredients: List[IngredientInCocktailDetail] = []
    # Lista pełnych obiektów tagów
    tags: List[TagSchema] = []