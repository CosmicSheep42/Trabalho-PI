from __future__ import annotations

from datetime import date as dt_date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ShoppingList(Base):
    __tablename__ = "lists"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    color: Mapped[str] = mapped_column(String(50), nullable=False)
    date: Mapped[dt_date | None] = mapped_column(Date, nullable=True)

    user = relationship("User", back_populates="lists")
    shared_memberships = relationship(
        "ListMember",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    items = relationship(
        "ListItem",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    recipe_links = relationship(
        "ListRecipe",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    event_links = relationship(
        "EventList",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    meal_plan_entries = relationship(
        "MealPlanEntry",
        back_populates="shopping_list",
        passive_deletes=True,
    )

    @property
    def recipe_ids(self) -> list[int]:
        return [link.recipe_id for link in self.recipe_links]

    @property
    def owner(self):
        return self.user

    @property
    def collaborators(self):
        return [membership.user for membership in self.shared_memberships if membership.user is not None]

    @property
    def list_recipes(self):
        return self.recipe_links
