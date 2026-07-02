"""add friendships and friendship requests

Revision ID: 20260702_000003
Revises: 20260702_000002
Create Date: 2026-07-02 00:00:03
"""

from alembic import op
import sqlalchemy as sa


revision = "20260702_000003"
down_revision = "20260702_000002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "friendships",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_one_id", sa.Integer(), nullable=False),
        sa.Column("user_two_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_one_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_two_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_one_id", "user_two_id", name="uq_friendships_pair"),
    )
    op.create_index("ix_friendships_id", "friendships", ["id"], unique=False)
    op.create_index("ix_friendships_user_one_id", "friendships", ["user_one_id"], unique=False)
    op.create_index("ix_friendships_user_two_id", "friendships", ["user_two_id"], unique=False)

    op.create_table(
        "friendship_requests",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("requester_id", sa.Integer(), nullable=False),
        sa.Column("addressee_id", sa.Integer(), nullable=False),
        sa.Column("user_one_id", sa.Integer(), nullable=False),
        sa.Column("user_two_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("responded_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["requester_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["addressee_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_one_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_two_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_one_id", "user_two_id", name="uq_friendship_requests_pair"),
    )
    op.create_index("ix_friendship_requests_id", "friendship_requests", ["id"], unique=False)
    op.create_index("ix_friendship_requests_requester_id", "friendship_requests", ["requester_id"], unique=False)
    op.create_index("ix_friendship_requests_addressee_id", "friendship_requests", ["addressee_id"], unique=False)
    op.create_index("ix_friendship_requests_user_one_id", "friendship_requests", ["user_one_id"], unique=False)
    op.create_index("ix_friendship_requests_user_two_id", "friendship_requests", ["user_two_id"], unique=False)
    op.create_index("ix_friendship_requests_status", "friendship_requests", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_friendship_requests_status", table_name="friendship_requests")
    op.drop_index("ix_friendship_requests_user_two_id", table_name="friendship_requests")
    op.drop_index("ix_friendship_requests_user_one_id", table_name="friendship_requests")
    op.drop_index("ix_friendship_requests_addressee_id", table_name="friendship_requests")
    op.drop_index("ix_friendship_requests_requester_id", table_name="friendship_requests")
    op.drop_index("ix_friendship_requests_id", table_name="friendship_requests")
    op.drop_table("friendship_requests")

    op.drop_index("ix_friendships_user_two_id", table_name="friendships")
    op.drop_index("ix_friendships_user_one_id", table_name="friendships")
    op.drop_index("ix_friendships_id", table_name="friendships")
    op.drop_table("friendships")
