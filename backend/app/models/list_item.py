from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, String, text as sql_text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ListItem(Base):
    __tablename__ = "list_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    list_id: Mapped[int] = mapped_column(
        ForeignKey("lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    text: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[str] = mapped_column(String(255), nullable=False, server_default="")
    checked: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=sql_text("0"))

    shopping_list = relationship("ShoppingList", back_populates="items")
