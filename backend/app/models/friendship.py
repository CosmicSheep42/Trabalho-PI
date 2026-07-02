from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Friendship(Base):
    __tablename__ = "friendships"
    __table_args__ = (
        UniqueConstraint("user_one_id", "user_two_id", name="uq_friendships_pair"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_one_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_two_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    user_one = relationship("User", foreign_keys=[user_one_id])
    user_two = relationship("User", foreign_keys=[user_two_id])
