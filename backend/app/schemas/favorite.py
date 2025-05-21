from pydantic import BaseModel
from datetime import datetime

class FavoriteBase(BaseModel):
    cocktail_id: int

class FavoriteCreate(FavoriteBase):
    pass

class FavoriteInDBBase(FavoriteBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Favorite(FavoriteInDBBase):
    pass