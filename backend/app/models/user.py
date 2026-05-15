from sqlalchemy import Boolean, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    clerk_user_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    vegan: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    vegetarian: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    lactose_free: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    gluten_free: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    no_eggs: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    nut_free: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    low_carb: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    high_protein: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
