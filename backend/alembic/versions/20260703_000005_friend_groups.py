"""add private friend groups

Revision ID: 20260703_000005
Revises: 20260703_000004
Create Date: 2026-07-03 00:00:05
"""

from alembic import op
import sqlalchemy as sa


revision = "20260703_000005"
down_revision = "20260703_000004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "friend_groups",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_friend_groups_id", "friend_groups", ["id"], unique=False)
    op.create_index("ix_friend_groups_user_id", "friend_groups", ["user_id"], unique=False)

    op.create_table(
        "friend_group_members",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("friend_user_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["friend_groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["friend_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("group_id", "friend_user_id", name="uq_friend_group_members_group_friend"),
    )
    op.create_index("ix_friend_group_members_id", "friend_group_members", ["id"], unique=False)
    op.create_index("ix_friend_group_members_group_id", "friend_group_members", ["group_id"], unique=False)
    op.create_index("ix_friend_group_members_friend_user_id", "friend_group_members", ["friend_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_friend_group_members_friend_user_id", table_name="friend_group_members")
    op.drop_index("ix_friend_group_members_group_id", table_name="friend_group_members")
    op.drop_index("ix_friend_group_members_id", table_name="friend_group_members")
    op.drop_table("friend_group_members")

    op.drop_index("ix_friend_groups_user_id", table_name="friend_groups")
    op.drop_index("ix_friend_groups_id", table_name="friend_groups")
    op.drop_table("friend_groups")
