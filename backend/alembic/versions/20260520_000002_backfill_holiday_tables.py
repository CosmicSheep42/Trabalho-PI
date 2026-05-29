"""backfill holiday tables for existing databases

Revision ID: 20260520_000002
Revises: 20260516_000001
Create Date: 2026-05-20 00:00:02
"""

from alembic import op
import sqlalchemy as sa


revision = "20260520_000002"
down_revision = "20260516_000001"
branch_labels = None
depends_on = None

TAG_CATEGORY_VALUES = (
    "meal_type",
    "cuisine",
    "occasion",
    "weather",
    "difficulty",
    "cooking_method",
    "main_protein",
)


def _enum_sql(values: tuple[str, ...]) -> str:
    return ", ".join(f"'{value}'" for value in values)


def _index_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    op.execute(
        f"""
        ALTER TABLE tags
        MODIFY COLUMN category ENUM({_enum_sql(TAG_CATEGORY_VALUES)}) NOT NULL
        """
    )

    if not inspector.has_table("holidays"):
        op.create_table(
            "holidays",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("slug", sa.String(length=255), nullable=False),
            sa.UniqueConstraint("slug", name="uq_holidays_slug"),
        )

    holiday_indexes = _index_names(inspector, "holidays") if inspector.has_table("holidays") else set()
    if "ix_holidays_id" not in holiday_indexes:
        op.create_index("ix_holidays_id", "holidays", ["id"], unique=False)
    if "ix_holidays_slug" not in holiday_indexes:
        op.create_index("ix_holidays_slug", "holidays", ["slug"], unique=False)

    if not inspector.has_table("recipe_holidays"):
        op.create_table(
            "recipe_holidays",
            sa.Column("recipe_id", sa.Integer(), nullable=False),
            sa.Column("holiday_id", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["holiday_id"], ["holidays.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("recipe_id", "holiday_id", name="pk_recipe_holidays"),
        )

    recipe_holiday_indexes = (
        _index_names(inspector, "recipe_holidays") if inspector.has_table("recipe_holidays") else set()
    )
    if "ix_recipe_holidays_recipe_id" not in recipe_holiday_indexes:
        op.create_index("ix_recipe_holidays_recipe_id", "recipe_holidays", ["recipe_id"], unique=False)
    if "ix_recipe_holidays_holiday_id" not in recipe_holiday_indexes:
        op.create_index("ix_recipe_holidays_holiday_id", "recipe_holidays", ["holiday_id"], unique=False)


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())

    if inspector.has_table("recipe_holidays"):
        recipe_holiday_indexes = _index_names(inspector, "recipe_holidays")
        if "ix_recipe_holidays_holiday_id" in recipe_holiday_indexes:
            op.drop_index("ix_recipe_holidays_holiday_id", table_name="recipe_holidays")
        if "ix_recipe_holidays_recipe_id" in recipe_holiday_indexes:
            op.drop_index("ix_recipe_holidays_recipe_id", table_name="recipe_holidays")
        op.drop_table("recipe_holidays")

    if inspector.has_table("holidays"):
        holiday_indexes = _index_names(inspector, "holidays")
        if "ix_holidays_slug" in holiday_indexes:
            op.drop_index("ix_holidays_slug", table_name="holidays")
        if "ix_holidays_id" in holiday_indexes:
            op.drop_index("ix_holidays_id", table_name="holidays")
        op.drop_table("holidays")
