"""create users table

Revision ID: 20260515_000001
Revises:
Create Date: 2026-05-15 00:00:01
"""

from alembic import op
import sqlalchemy as sa


revision = "20260515_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("clerk_user_id", sa.String(length=255), nullable=False),
        sa.Column("vegan", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("vegetarian", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("lactose_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("gluten_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("no_eggs", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("nut_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("low_carb", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("high_protein", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_clerk_user_id", "users", ["clerk_user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_clerk_user_id", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
