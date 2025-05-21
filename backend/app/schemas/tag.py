from typing import Optional
from pydantic import BaseModel

class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class TagUpdate(BaseModel):
    name: Optional[str] = None

class TagInDBBase(TagBase):
    id: int

    class Config:
        from_attributes = True

class Tag(TagInDBBase):
    pass