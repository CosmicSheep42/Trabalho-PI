from __future__ import annotations

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RecipeHoliday(Base):
    __tablename__ = "recipe_holidays"

    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    holiday_id: Mapped[int] = mapped_column(
        ForeignKey("holidays.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )

    recipe = relationship("Recipe", back_populates="holiday_links")
    holiday = relationship("Holiday", back_populates="recipe_links")
