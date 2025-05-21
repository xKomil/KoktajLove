from typing import Optional, Annotated
from pydantic import BaseModel, Field 
from datetime import datetime

class RatingBase(BaseModel):
    rating_value: Annotated[int, Field(ge=1, le=5)] # Ocena od 1 do 5
    comment: Optional[str] = None

class RatingCreate(RatingBase):
    cocktail_id: int

class RatingUpdate(BaseModel):
    rating_value: Optional[Annotated[int, Field(ge=1, le=5)]] = None
    comment: Optional[str] = None

class RatingInDBBase(RatingBase):
    id: int
    user_id: int
    cocktail_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Rating(RatingInDBBase):
    pass