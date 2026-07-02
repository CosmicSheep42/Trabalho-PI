from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class FriendshipRequest(Base):
    __tablename__ = "friendship_requests"
    __table_args__ = (
        UniqueConstraint("user_one_id", "user_two_id", name="uq_friendship_requests_pair"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    requester_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    addressee_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
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
    status: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    requester = relationship(
        "User",
        foreign_keys=[requester_id],
        back_populates="sent_friendship_requests",
    )
    addressee = relationship(
        "User",
        foreign_keys=[addressee_id],
        back_populates="received_friendship_requests",
    )
