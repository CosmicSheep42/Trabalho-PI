"""add shared event collaborators

Revision ID: 20260703_000006
Revises: 20260703_000005
Create Date: 2026-07-03 00:00:06
"""

from alembic import op
import sqlalchemy as sa


revision = "20260703_000006"
down_revision = "20260703_000005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "event_members",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("invited_by_user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["calendar_events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("event_id", "user_id", name="uq_event_members_event_user"),
    )
    op.create_index("ix_event_members_id", "event_members", ["id"], unique=False)
    op.create_index("ix_event_members_event_id", "event_members", ["event_id"], unique=False)
    op.create_index("ix_event_members_user_id", "event_members", ["user_id"], unique=False)
    op.create_index("ix_event_members_invited_by_user_id", "event_members", ["invited_by_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_event_members_invited_by_user_id", table_name="event_members")
    op.drop_index("ix_event_members_user_id", table_name="event_members")
    op.drop_index("ix_event_members_event_id", table_name="event_members")
    op.drop_index("ix_event_members_id", table_name="event_members")
    op.drop_table("event_members")
