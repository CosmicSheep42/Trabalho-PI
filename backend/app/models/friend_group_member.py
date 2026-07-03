from __future__ import annotations

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class FriendGroupMember(Base):
    __tablename__ = "friend_group_members"
    __table_args__ = (
        UniqueConstraint("group_id", "friend_user_id", name="uq_friend_group_members_group_friend"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    group_id: Mapped[int] = mapped_column(
        ForeignKey("friend_groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    friend_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    group = relationship("FriendGroup", back_populates="members")
    friend_user = relationship("User")
