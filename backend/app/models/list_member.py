from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ListMember(Base):
    __tablename__ = "list_members"
    __table_args__ = (
        UniqueConstraint("list_id", "user_id", name="uq_list_members_list_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    list_id: Mapped[int] = mapped_column(
        ForeignKey("lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    invited_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    shopping_list = relationship("ShoppingList", back_populates="shared_memberships")
    user = relationship("User", foreign_keys=[user_id], back_populates="shared_list_memberships")
    invited_by_user = relationship("User", foreign_keys=[invited_by_user_id])
