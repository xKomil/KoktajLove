from typing import Optional
from pydantic import BaseModel

class IngredientBase(BaseModel):
    name: str

class IngredientCreate(IngredientBase):
    pass

class IngredientUpdate(BaseModel):
    name: Optional[str] = None

class IngredientInDBBase(IngredientBase):
    id: int

    class Config:
        from_attributes = True

class Ingredient(IngredientInDBBase):
    pass