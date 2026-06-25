"""add calendar events and list associations

Revision ID: 20260624_000005
Revises: 20260522_000004
Create Date: 2026-06-24 00:00:05
"""

from alembic import op
import sqlalchemy as sa


revision = "20260624_000005"
down_revision = "20260522_000004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "calendar_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("icon", sa.String(length=64), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_calendar_events_id", "calendar_events", ["id"], unique=False)
    op.create_index("ix_calendar_events_user_id", "calendar_events", ["user_id"], unique=False)
    op.create_index("ix_calendar_events_date", "calendar_events", ["date"], unique=False)

    op.create_table(
        "event_lists",
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("list_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["calendar_events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["list_id"], ["lists.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("event_id", "list_id"),
    )


def downgrade() -> None:
    op.drop_table("event_lists")
    op.drop_index("ix_calendar_events_date", table_name="calendar_events")
    op.drop_index("ix_calendar_events_user_id", table_name="calendar_events")
    op.drop_index("ix_calendar_events_id", table_name="calendar_events")
    op.drop_table("calendar_events")
