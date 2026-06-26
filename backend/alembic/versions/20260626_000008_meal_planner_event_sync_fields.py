"""add event sync fields to meal planner entries

Revision ID: 20260626_000008
Revises: 20260626_000007
Create Date: 2026-06-26 00:00:08.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260626_000008"
down_revision = "20260626_000007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "meal_plan_entries",
        sa.Column("source", sa.String(length=32), nullable=False, server_default="manual"),
    )
    op.add_column(
        "meal_plan_entries",
        sa.Column("event_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "meal_plan_entries",
        sa.Column("scheduled_date", sa.Date(), nullable=True),
    )
    op.create_index("ix_meal_plan_entries_source", "meal_plan_entries", ["source"], unique=False)
    op.create_index("ix_meal_plan_entries_event_id", "meal_plan_entries", ["event_id"], unique=False)
    op.create_index("ix_meal_plan_entries_scheduled_date", "meal_plan_entries", ["scheduled_date"], unique=False)
    op.create_foreign_key(
        "fk_meal_plan_entries_event_id_calendar_events",
        "meal_plan_entries",
        "calendar_events",
        ["event_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.alter_column("meal_plan_entries", "source", server_default=None)


def downgrade() -> None:
    op.drop_constraint("fk_meal_plan_entries_event_id_calendar_events", "meal_plan_entries", type_="foreignkey")
    op.drop_index("ix_meal_plan_entries_scheduled_date", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_event_id", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_source", table_name="meal_plan_entries")
    op.drop_column("meal_plan_entries", "scheduled_date")
    op.drop_column("meal_plan_entries", "event_id")
    op.drop_column("meal_plan_entries", "source")
