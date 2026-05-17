from __future__ import annotations

import enum

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TagCategory(str, enum.Enum):
    meal_type = "meal_type"
    cuisine = "cuisine"
    occasion = "occasion"


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    category: Mapped[TagCategory] = mapped_column(
        Enum(TagCategory, name="tag_category"),
        nullable=False,
        index=True,
    )

    recipe_links = relationship(
        "RecipeTag",
        back_populates="tag",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
