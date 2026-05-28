from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MealPlanEntry(Base):
    __tablename__ = "meal_plan_entries"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    list_id: Mapped[int | None] = mapped_column(
        ForeignKey("lists.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    day_of_week: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    servings: Mapped[int | None] = mapped_column(Integer, nullable=True)

    user = relationship("User", back_populates="meal_plan_entries")
    recipe = relationship("Recipe", back_populates="meal_plan_entries")
    shopping_list = relationship("ShoppingList", back_populates="meal_plan_entries")
