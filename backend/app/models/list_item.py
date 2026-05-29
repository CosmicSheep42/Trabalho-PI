from __future__ import annotations

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Numeric, String, text as sql_text
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.core.normalization import normalize_item_name
from app.db.base import Base


class ListItem(Base):
    __tablename__ = "list_items"
    __table_args__ = (
        CheckConstraint("quantity IS NULL OR quantity >= 0", name="ck_list_items_quantity_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    list_id: Mapped[int] = mapped_column(
        ForeignKey("lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float | None] = mapped_column(Numeric(10, 2, asdecimal=False), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    checked: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=sql_text("0"))

    shopping_list = relationship("ShoppingList", back_populates="items")

    @validates("name")
    def validate_name(self, key: str, value: str) -> str:
        return normalize_item_name(value)
