from __future__ import annotations

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EventList(Base):
    __tablename__ = "event_lists"

    event_id: Mapped[int] = mapped_column(
        ForeignKey("calendar_events.id", ondelete="CASCADE"),
        primary_key=True,
    )
    list_id: Mapped[int] = mapped_column(
        ForeignKey("lists.id", ondelete="CASCADE"),
        primary_key=True,
    )

    event = relationship("CalendarEvent", back_populates="list_links")
    shopping_list = relationship("ShoppingList", back_populates="event_links")
