from __future__ import annotations

from datetime import date as dt_date

from sqlalchemy import Date, ForeignKey, Integer, String
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
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="manual", index=True)
    event_id: Mapped[int | None] = mapped_column(
        ForeignKey("calendar_events.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    scheduled_date: Mapped[dt_date | None] = mapped_column(Date, nullable=True, index=True)

    user = relationship("User", back_populates="meal_plan_entries")
    recipe = relationship("Recipe", back_populates="meal_plan_entries")
    shopping_list = relationship("ShoppingList", back_populates="meal_plan_entries")
    event = relationship("CalendarEvent")
