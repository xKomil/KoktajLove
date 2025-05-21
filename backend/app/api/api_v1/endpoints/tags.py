from typing import List, Any, Optional # Dodano Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user

router = APIRouter()

@router.post("/", response_model=schemas.Tag, status_code=status.HTTP_201_CREATED)
def create_tag(
    *,
    db: Session = Depends(get_db),
    tag_in: schemas.TagCreate,
    # current_user: models.User = Depends(get_current_active_user) # Odkomentuj, jeśli wymagasz admina
):
    # if not current_user or not getattr(current_user, 'is_superuser', False):
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień administratora.")
    existing_tag = crud.tag.get_tag_by_name(db, name=tag_in.name)
    if existing_tag:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tag o tej nazwie już istnieje.")
    tag = crud.tag.create_tag(db=db, tag_in=tag_in)
    return tag

@router.get("/", response_model=List[schemas.Tag])
def read_tags(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    tags = crud.tag.get_tags(db, skip=skip, limit=limit)
    return tags

@router.get("/{tag_id}", response_model=schemas.Tag)
def read_tag(
    tag_id: int,
    db: Session = Depends(get_db),
):
    db_tag = crud.tag.get_tag(db, tag_id=tag_id)
    if db_tag is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag nie znaleziony.")
    return db_tag

@router.put("/{tag_id}", response_model=schemas.Tag)
def update_tag(
    *,
    db: Session = Depends(get_db),
    tag_id: int,
    tag_in: schemas.TagUpdate,
    # current_user: models.User = Depends(get_current_active_user) # Odkomentuj, jeśli wymagasz admina
):
    # if not current_user or not getattr(current_user, 'is_superuser', False):
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień administratora.")
    db_tag = crud.tag.get_tag(db, tag_id=tag_id)
    if not db_tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag nie znaleziony.")
    if tag_in.name and tag_in.name != db_tag.name:
        existing_tag = crud.tag.get_tag_by_name(db, name=tag_in.name)
        if existing_tag and existing_tag.id != tag_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tag o tej nazwie już istnieje.")
    tag = crud.tag.update_tag(db=db, db_tag=db_tag, tag_in=tag_in)
    return tag

@router.delete("/{tag_id}", response_model=schemas.Tag)
def delete_tag(
    *,
    db: Session = Depends(get_db),
    tag_id: int,
    # current_user: models.User = Depends(get_current_active_user) # Odkomentuj, jeśli wymagasz admina
):
    # if not current_user or not getattr(current_user, 'is_superuser', False):
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień administratora.")
    db_tag = crud.tag.get_tag(db, tag_id=tag_id)
    if not db_tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag nie znaleziony.")
    
    deleted_tag = crud.tag.delete_tag(db=db, tag_id=tag_id)
    if deleted_tag is None:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nie można usunąć tagu, prawdopodobnie jest używany w koktajlach.")
    return deleted_tag