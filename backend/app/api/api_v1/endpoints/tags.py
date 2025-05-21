from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.dependencies import get_db, get_current_active_user # Można dodać zależność admina

router = APIRouter()

@router.post("/", response_model=schemas.Tag, status_code=status.HTTP_201_CREATED)
def create_tag(
    *,
    db: Session = Depends(get_db),
    tag_in: schemas.TagCreate,
    # current_user: models.User = Depends(get_current_active_user) # Wymagaj admina
):
    """
    Create new tag. (Protected - example for admin only)
    """
    # if not crud.user.is_superuser(current_user):
    #     raise HTTPException(status_code=403, detail="Not enough permissions")
    existing_tag = crud.tag.get_tag_by_name(db, name=tag_in.name)
    if existing_tag:
        raise HTTPException(status_code=400, detail="Tag with this name already exists")
    tag = crud.tag.create_tag(db=db, tag_in=tag_in)
    return tag

@router.get("/", response_model=List[schemas.Tag])
def read_tags(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve tags.
    """
    tags = crud.tag.get_tags(db, skip=skip, limit=limit)
    return tags

@router.get("/{tag_id}", response_model=schemas.Tag)
def read_tag(
    tag_id: int,
    db: Session = Depends(get_db),
):
    """
    Get tag by ID.
    """
    db_tag = crud.tag.get_tag(db, tag_id=tag_id)
    if db_tag is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return db_tag

@router.put("/{tag_id}", response_model=schemas.Tag)
def update_tag(
    *,
    db: Session = Depends(get_db),
    tag_id: int,
    tag_in: schemas.TagUpdate,
    # current_user: models.User = Depends(get_current_active_user) # Wymagaj admina
):
    """
    Update a tag. (Protected - example for admin only)
    """
    # if not crud.user.is_superuser(current_user):
    #     raise HTTPException(status_code=403, detail="Not enough permissions")
    db_tag = crud.tag.get_tag(db, tag_id=tag_id)
    if not db_tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    if tag_in.name:
        existing_tag = crud.tag.get_tag_by_name(db, name=tag_in.name)
        if existing_tag and existing_tag.id != tag_id:
            raise HTTPException(status_code=400, detail="Tag with this name already exists")
    tag = crud.tag.update_tag(db=db, db_tag=db_tag, tag_in=tag_in)
    return tag

@router.delete("/{tag_id}", response_model=schemas.Tag)
def delete_tag(
    *,
    db: Session = Depends(get_db),
    tag_id: int,
    # current_user: models.User = Depends(get_current_active_user) # Wymagaj admina
):
    """
    Delete a tag. (Protected - example for admin only)
    """
    # if not crud.user.is_superuser(current_user):
    #     raise HTTPException(status_code=403, detail="Not enough permissions")
    db_tag = crud.tag.get_tag(db, tag_id=tag_id)
    if not db_tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    
    deleted_tag = crud.tag.delete_tag(db=db, tag_id=tag_id)
    if deleted_tag is None:
         raise HTTPException(status_code=400, detail="Tag could not be deleted, possibly in use.")
    return deleted_tag