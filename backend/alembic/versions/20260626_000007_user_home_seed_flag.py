"""add user home seed flag

Revision ID: 20260626_000007
Revises: 20260625_000006
Create Date: 2026-06-26 00:00:07.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260626_000007"
down_revision = "20260625_000006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("has_seeded_home_content", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )


def downgrade() -> None:
    op.drop_column("users", "has_seeded_home_content")
