from __future__ import annotations

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.core.normalization import normalize_item_name
from app.db.base import Base


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    __table_args__ = (
        CheckConstraint("quantity IS NULL OR quantity >= 0", name="ck_recipe_ingredients_quantity_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    recipe_id: Mapped[int] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float | None] = mapped_column(Numeric(10, 2, asdecimal=False), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)

    recipe = relationship("Recipe", back_populates="ingredients")

    @validates("name")
    def validate_name(self, key: str, value: str) -> str:
        return normalize_item_name(value)
