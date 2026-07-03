"""add shared list memberships

Revision ID: 20260703_000004
Revises: 20260702_000003
Create Date: 2026-07-03 00:00:04
"""

from alembic import op
import sqlalchemy as sa


revision = "20260703_000004"
down_revision = "20260702_000003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "list_members",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("list_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("invited_by_user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["list_id"], ["lists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("list_id", "user_id", name="uq_list_members_list_user"),
    )
    op.create_index("ix_list_members_id", "list_members", ["id"], unique=False)
    op.create_index("ix_list_members_list_id", "list_members", ["list_id"], unique=False)
    op.create_index("ix_list_members_user_id", "list_members", ["user_id"], unique=False)
    op.create_index("ix_list_members_invited_by_user_id", "list_members", ["invited_by_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_list_members_invited_by_user_id", table_name="list_members")
    op.drop_index("ix_list_members_user_id", table_name="list_members")
    op.drop_index("ix_list_members_list_id", table_name="list_members")
    op.drop_index("ix_list_members_id", table_name="list_members")
    op.drop_table("list_members")
