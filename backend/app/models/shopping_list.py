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
    items = relationship(
        "ListItem",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
