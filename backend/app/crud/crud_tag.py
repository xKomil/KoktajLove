from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate

class CRUDTag:
    def get_tag(self, db: Session, tag_id: int) -> Optional[Tag]:
        return db.query(Tag).filter(Tag.id == tag_id).first()

    def get_tag_by_name(self, db: Session, name: str) -> Optional[Tag]:
        return db.query(Tag).filter(Tag.name == name).first()

    def get_tags(self, db: Session, skip: int = 0, limit: int = 100) -> List[Tag]:
        return db.query(Tag).offset(skip).limit(limit).all()

    def create_tag(self, db: Session, tag_in: TagCreate) -> Tag:
        db_tag = Tag(name=tag_in.name)
        db.add(db_tag)
        db.commit()
        db.refresh(db_tag)
        return db_tag

    def update_tag(self, db: Session, db_tag: Tag, tag_in: TagUpdate) -> Tag:
        if tag_in.name is not None:
            db_tag.name = tag_in.name
        db.add(db_tag)
        db.commit()
        db.refresh(db_tag)
        return db_tag

    def delete_tag(self, db: Session, tag_id: int) -> Optional[Tag]:
        db_tag = self.get_tag(db, tag_id)
        if db_tag:
            # Podobnie jak przy składnikach, ForeignKey ondelete="RESTRICT"
            # w cocktail_tags uniemożliwi usunięcie, jeśli tag jest używany.
            try:
                db.delete(db_tag)
                db.commit()
                return db_tag
            except Exception as e:
                db.rollback()
                print(f"Error deleting tag: {e}")
                return None
        return None


tag = CRUDTag()