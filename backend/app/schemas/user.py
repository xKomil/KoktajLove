from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

# Schemat bazowy dla właściwości użytkownika
class UserBase(BaseModel):
    username: str
    email: EmailStr
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

# Schemat do tworzenia użytkownika (dziedziczy z UserBase, dodaje hasło)
class UserCreate(UserBase):
    password: str

# Schemat do aktualizacji użytkownika (wszystkie pola opcjonalne)
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

# Schemat bazowy dla użytkownika w bazie danych (dziedziczy z UserBase, dodaje ID i daty)
class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Pydantic v2, orm_mode w v1

# Główny schemat użytkownika (używany do zwracania danych z API)
class User(UserInDBBase):
    pass

# Schemat użytkownika przechowywany w bazie (zawiera zahaszowane hasło)
# Może nie być potrzebny na zewnątrz, ale przydatny wewnętrznie
class UserInDB(UserInDBBase):
    hashed_password: str