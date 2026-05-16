"""create lists and list_items tables

Revision ID: 20260515_000002
Revises: 20260515_000001
Create Date: 2026-05-15 00:00:02
"""

from alembic import op
import sqlalchemy as sa


revision = "20260515_000002"
down_revision = "20260515_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lists",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("color", sa.String(length=50), nullable=False),
        sa.Column("date", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_lists_id", "lists", ["id"], unique=False)
    op.create_index("ix_lists_user_id", "lists", ["user_id"], unique=False)

    op.create_table(
        "list_items",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("list_id", sa.Integer(), nullable=False),
        sa.Column("text", sa.String(length=255), nullable=False),
        sa.Column("amount", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("checked", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.ForeignKeyConstraint(["list_id"], ["lists.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_list_items_id", "list_items", ["id"], unique=False)
    op.create_index("ix_list_items_list_id", "list_items", ["list_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_list_items_list_id", table_name="list_items")
    op.drop_index("ix_list_items_id", table_name="list_items")
    op.drop_table("list_items")
    op.drop_index("ix_lists_user_id", table_name="lists")
    op.drop_index("ix_lists_id", table_name="lists")
    op.drop_table("lists")
