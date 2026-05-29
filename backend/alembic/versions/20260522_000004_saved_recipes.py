"""add saved recipes collection

Revision ID: 20260522_000004
Revises: 20260522_000003
Create Date: 2026-05-22 00:00:04
"""

from alembic import op
import sqlalchemy as sa


revision = "20260522_000004"
down_revision = "20260522_000003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "saved_recipes",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("servings", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "recipe_id", name="pk_saved_recipes"),
    )
    op.create_index("ix_saved_recipes_user_id", "saved_recipes", ["user_id"], unique=False)
    op.create_index("ix_saved_recipes_recipe_id", "saved_recipes", ["recipe_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_saved_recipes_recipe_id", table_name="saved_recipes")
    op.drop_index("ix_saved_recipes_user_id", table_name="saved_recipes")
    op.drop_table("saved_recipes")
