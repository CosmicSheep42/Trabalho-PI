"""add home social tables

Revision ID: 20260705_000004
Revises: 20260702_000003
Create Date: 2026-07-05 00:00:04
"""

from alembic import op
import sqlalchemy as sa


revision = "20260705_000004"
down_revision = "20260702_000003"
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

    op.drop_index("ix_list_members_invited_by_user_id", table_name="list_members")
    op.drop_index("ix_list_members_user_id", table_name="list_members")
    op.drop_index("ix_list_members_list_id", table_name="list_members")
    op.drop_index("ix_list_members_id", table_name="list_members")
    op.drop_table("list_members")

    op.drop_index("ix_friend_group_members_friend_user_id", table_name="friend_group_members")
    op.drop_index("ix_friend_group_members_group_id", table_name="friend_group_members")
    op.drop_index("ix_friend_group_members_id", table_name="friend_group_members")
    op.drop_table("friend_group_members")

    op.drop_index("ix_friend_groups_user_id", table_name="friend_groups")
    op.drop_index("ix_friend_groups_id", table_name="friend_groups")
    op.drop_table("friend_groups")
