from __future__ import annotations

from sqlalchemy import Boolean, Integer, JSON, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image: Mapped[str] = mapped_column(String(255), nullable=False)
    prep_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    servings: Mapped[int | None] = mapped_column(Integer, nullable=True)
    instructions: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    vegan: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    vegetarian: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    lactose_free: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    egg_free: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    gluten_free: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    nut_free: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    shellfish_free: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    soy_free: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    sesame_free: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    sulfite_free: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))

    tag_links = relationship(
        "RecipeTag",
        back_populates="recipe",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    holiday_links = relationship(
        "RecipeHoliday",
        back_populates="recipe",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    favorite_links = relationship(
        "FavoriteRecipe",
        back_populates="recipe",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    saved_links = relationship(
        "SavedRecipe",
        back_populates="recipe",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    rating_links = relationship(
        "RecipeRating",
        back_populates="recipe",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    list_links = relationship(
        "ListRecipe",
        back_populates="recipe",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    meal_plan_entries = relationship(
        "MealPlanEntry",
        back_populates="recipe",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    ingredients = relationship(
        "RecipeIngredient",
        back_populates="recipe",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="RecipeIngredient.id",
    )
