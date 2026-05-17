from __future__ import annotations

from sqlalchemy import CheckConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RecipeRating(Base):
    __tablename__ = "recipe_ratings"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_recipe_ratings_rating_range"),
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    rating: Mapped[int] = mapped_column(nullable=False)

    user = relationship("User", back_populates="recipe_rating_links")
    recipe = relationship("Recipe", back_populates="rating_links")
