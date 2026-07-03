from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    clerk_user_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)
    username_updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    have_username: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
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
    has_seeded_home_content: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("0"),
    )

    lists = relationship(
        "ShoppingList",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    shared_list_memberships = relationship(
        "ListMember",
        foreign_keys="ListMember.user_id",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    shared_event_memberships = relationship(
        "EventMember",
        foreign_keys="EventMember.user_id",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    friend_groups = relationship(
        "FriendGroup",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    favorite_recipe_links = relationship(
        "FavoriteRecipe",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    saved_recipe_links = relationship(
        "SavedRecipe",
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
    meal_plan_entries = relationship(
        "MealPlanEntry",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    calendar_events = relationship(
        "CalendarEvent",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    sent_friendship_requests = relationship(
        "FriendshipRequest",
        foreign_keys="FriendshipRequest.requester_id",
        back_populates="requester",
        passive_deletes=True,
    )
    received_friendship_requests = relationship(
        "FriendshipRequest",
        foreign_keys="FriendshipRequest.addressee_id",
        back_populates="addressee",
        passive_deletes=True,
    )
