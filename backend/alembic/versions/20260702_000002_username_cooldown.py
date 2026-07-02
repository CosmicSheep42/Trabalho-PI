"""add username cooldown timestamp

Revision ID: 20260702_000002
Revises: 20260702_000001
Create Date: 2026-07-02 00:00:02
"""

from alembic import op
import sqlalchemy as sa


revision = "20260702_000002"
down_revision = "20260702_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("username_updated_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "username_updated_at")
