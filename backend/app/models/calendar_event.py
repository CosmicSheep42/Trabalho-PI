from __future__ import annotations

from datetime import date as dt_date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    icon: Mapped[str] = mapped_column(String(64), nullable=False)
    date: Mapped[dt_date] = mapped_column(Date, nullable=False, index=True)

    user = relationship("User", back_populates="calendar_events")
    shared_memberships = relationship(
        "EventMember",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    list_links = relationship(
        "EventList",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    @property
    def list_ids(self) -> list[int]:
        return [link.list_id for link in self.list_links]

    @property
    def owner(self):
        return self.user

    @property
    def collaborators(self):
        return [membership.user for membership in self.shared_memberships if membership.user is not None]
