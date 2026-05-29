from sqlalchemy import Boolean, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    clerk_user_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
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

    lists = relationship(
        "ShoppingList",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    favorite_recipe_links = relationship(
        "FavoriteRecipe",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    recipe_rating_links = relationship(
        "RecipeRating",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
