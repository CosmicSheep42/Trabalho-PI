from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Holiday(Base):
    __tablename__ = "holidays"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)

    recipe_links = relationship(
        "RecipeHoliday",
        back_populates="holiday",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
