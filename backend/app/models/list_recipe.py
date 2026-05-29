from __future__ import annotations

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ListRecipe(Base):
    __tablename__ = "list_recipes"

    list_id: Mapped[int] = mapped_column(
        ForeignKey("lists.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )

    shopping_list = relationship("ShoppingList", back_populates="recipe_links")
    recipe = relationship("Recipe", back_populates="list_links")
