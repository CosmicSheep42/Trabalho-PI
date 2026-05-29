"""add meal planner entries and custom servings on list recipes

Revision ID: 20260522_000003
Revises: 20260520_000002
Create Date: 2026-05-22 00:00:03
"""

from alembic import op
import sqlalchemy as sa


revision = "20260522_000003"
down_revision = "20260520_000002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("list_recipes", sa.Column("servings", sa.Integer(), nullable=True))

    op.create_table(
        "meal_plan_entries",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("list_id", sa.Integer(), nullable=True),
        sa.Column("day_of_week", sa.String(length=16), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("servings", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["list_id"], ["lists.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_meal_plan_entries_id", "meal_plan_entries", ["id"], unique=False)
    op.create_index("ix_meal_plan_entries_user_id", "meal_plan_entries", ["user_id"], unique=False)
    op.create_index("ix_meal_plan_entries_recipe_id", "meal_plan_entries", ["recipe_id"], unique=False)
    op.create_index("ix_meal_plan_entries_list_id", "meal_plan_entries", ["list_id"], unique=False)
    op.create_index("ix_meal_plan_entries_day_of_week", "meal_plan_entries", ["day_of_week"], unique=False)

    op.alter_column("meal_plan_entries", "position", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_meal_plan_entries_day_of_week", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_list_id", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_recipe_id", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_user_id", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_id", table_name="meal_plan_entries")
    op.drop_table("meal_plan_entries")

    op.drop_column("list_recipes", "servings")
