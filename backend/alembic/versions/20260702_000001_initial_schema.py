"""initial schema reset

Revision ID: 20260702_000001
Revises:
Create Date: 2026-07-02 00:00:01
"""

from alembic import op
import sqlalchemy as sa


revision = "20260702_000001"
down_revision = None
branch_labels = None
depends_on = None

TAG_CATEGORY_ENUM = sa.Enum(
    "meal_type",
    "cuisine",
    "occasion",
    "weather",
    "difficulty",
    "cooking_method",
    "main_protein",
    name="tag_category",
)


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("clerk_user_id", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=True),
        sa.Column("have_username", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("vegan", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("vegetarian", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("lactose_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("egg_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("gluten_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("nut_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("shellfish_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("soy_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("sesame_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("sulfite_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("has_seeded_home_content", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_clerk_user_id", "users", ["clerk_user_id"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "recipes",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image", sa.String(length=255), nullable=False),
        sa.Column("prep_time_minutes", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("servings", sa.Integer(), nullable=True),
        sa.Column("instructions", sa.JSON(), nullable=False),
        sa.Column("vegan", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("vegetarian", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("lactose_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("egg_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("gluten_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("nut_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("shellfish_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("soy_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("sesame_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("sulfite_free", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.create_index("ix_recipes_id", "recipes", ["id"], unique=False)
    op.create_index("ix_recipes_name", "recipes", ["name"], unique=False)

    op.create_table(
        "tags",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("category", TAG_CATEGORY_ENUM, nullable=False),
        sa.UniqueConstraint("slug", name="uq_tags_slug"),
    )
    op.create_index("ix_tags_id", "tags", ["id"], unique=False)
    op.create_index("ix_tags_slug", "tags", ["slug"], unique=False)
    op.create_index("ix_tags_category", "tags", ["category"], unique=False)

    op.create_table(
        "holidays",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.UniqueConstraint("slug", name="uq_holidays_slug"),
    )
    op.create_index("ix_holidays_id", "holidays", ["id"], unique=False)
    op.create_index("ix_holidays_slug", "holidays", ["slug"], unique=False)

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
        "calendar_events",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("icon", sa.String(length=64), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_calendar_events_id", "calendar_events", ["id"], unique=False)
    op.create_index("ix_calendar_events_user_id", "calendar_events", ["user_id"], unique=False)
    op.create_index("ix_calendar_events_date", "calendar_events", ["date"], unique=False)

    op.create_table(
        "recipe_ingredients",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=10, scale=2, asdecimal=False), nullable=True),
        sa.Column("unit", sa.String(length=50), nullable=True),
        sa.CheckConstraint("quantity IS NULL OR quantity >= 0", name="ck_recipe_ingredients_quantity_non_negative"),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_recipe_ingredients_id", "recipe_ingredients", ["id"], unique=False)
    op.create_index("ix_recipe_ingredients_recipe_id", "recipe_ingredients", ["recipe_id"], unique=False)

    op.create_table(
        "favorite_recipes",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "recipe_id", name="pk_favorite_recipes"),
    )
    op.create_index("ix_favorite_recipes_user_id", "favorite_recipes", ["user_id"], unique=False)
    op.create_index("ix_favorite_recipes_recipe_id", "favorite_recipes", ["recipe_id"], unique=False)

    op.create_table(
        "saved_recipes",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("servings", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "recipe_id", name="pk_saved_recipes"),
    )
    op.create_index("ix_saved_recipes_user_id", "saved_recipes", ["user_id"], unique=False)
    op.create_index("ix_saved_recipes_recipe_id", "saved_recipes", ["recipe_id"], unique=False)

    op.create_table(
        "list_items",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("list_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=10, scale=2, asdecimal=False), nullable=True),
        sa.Column("unit", sa.String(length=50), nullable=True),
        sa.Column("checked", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.CheckConstraint("quantity IS NULL OR quantity >= 0", name="ck_list_items_quantity_non_negative"),
        sa.ForeignKeyConstraint(["list_id"], ["lists.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_list_items_id", "list_items", ["id"], unique=False)
    op.create_index("ix_list_items_list_id", "list_items", ["list_id"], unique=False)

    op.create_table(
        "list_recipes",
        sa.Column("list_id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("servings", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["list_id"], ["lists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("list_id", "recipe_id", name="pk_list_recipes"),
    )
    op.create_index("ix_list_recipes_list_id", "list_recipes", ["list_id"], unique=False)
    op.create_index("ix_list_recipes_recipe_id", "list_recipes", ["recipe_id"], unique=False)

    op.create_table(
        "event_lists",
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("list_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["calendar_events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["list_id"], ["lists.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("event_id", "list_id"),
    )

    op.create_table(
        "recipe_ratings",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_recipe_ratings_rating_range"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "recipe_id", name="pk_recipe_ratings"),
    )
    op.create_index("ix_recipe_ratings_user_id", "recipe_ratings", ["user_id"], unique=False)
    op.create_index("ix_recipe_ratings_recipe_id", "recipe_ratings", ["recipe_id"], unique=False)

    op.create_table(
        "recipe_tags",
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("recipe_id", "tag_id", name="pk_recipe_tags"),
    )
    op.create_index("ix_recipe_tags_recipe_id", "recipe_tags", ["recipe_id"], unique=False)
    op.create_index("ix_recipe_tags_tag_id", "recipe_tags", ["tag_id"], unique=False)

    op.create_table(
        "recipe_holidays",
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("holiday_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["holiday_id"], ["holidays.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("recipe_id", "holiday_id", name="pk_recipe_holidays"),
    )
    op.create_index("ix_recipe_holidays_recipe_id", "recipe_holidays", ["recipe_id"], unique=False)
    op.create_index("ix_recipe_holidays_holiday_id", "recipe_holidays", ["holiday_id"], unique=False)

    op.create_table(
        "meal_plan_entries",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("list_id", sa.Integer(), nullable=True),
        sa.Column("day_of_week", sa.String(length=16), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("servings", sa.Integer(), nullable=True),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=True),
        sa.Column("scheduled_date", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["list_id"], ["lists.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["event_id"], ["calendar_events.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_meal_plan_entries_id", "meal_plan_entries", ["id"], unique=False)
    op.create_index("ix_meal_plan_entries_user_id", "meal_plan_entries", ["user_id"], unique=False)
    op.create_index("ix_meal_plan_entries_recipe_id", "meal_plan_entries", ["recipe_id"], unique=False)
    op.create_index("ix_meal_plan_entries_list_id", "meal_plan_entries", ["list_id"], unique=False)
    op.create_index("ix_meal_plan_entries_day_of_week", "meal_plan_entries", ["day_of_week"], unique=False)
    op.create_index("ix_meal_plan_entries_source", "meal_plan_entries", ["source"], unique=False)
    op.create_index("ix_meal_plan_entries_event_id", "meal_plan_entries", ["event_id"], unique=False)
    op.create_index("ix_meal_plan_entries_scheduled_date", "meal_plan_entries", ["scheduled_date"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_meal_plan_entries_scheduled_date", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_event_id", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_source", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_day_of_week", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_list_id", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_recipe_id", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_user_id", table_name="meal_plan_entries")
    op.drop_index("ix_meal_plan_entries_id", table_name="meal_plan_entries")
    op.drop_table("meal_plan_entries")

    op.drop_index("ix_recipe_holidays_holiday_id", table_name="recipe_holidays")
    op.drop_index("ix_recipe_holidays_recipe_id", table_name="recipe_holidays")
    op.drop_table("recipe_holidays")

    op.drop_index("ix_recipe_tags_tag_id", table_name="recipe_tags")
    op.drop_index("ix_recipe_tags_recipe_id", table_name="recipe_tags")
    op.drop_table("recipe_tags")

    op.drop_index("ix_recipe_ratings_recipe_id", table_name="recipe_ratings")
    op.drop_index("ix_recipe_ratings_user_id", table_name="recipe_ratings")
    op.drop_table("recipe_ratings")

    op.drop_table("event_lists")

    op.drop_index("ix_list_recipes_recipe_id", table_name="list_recipes")
    op.drop_index("ix_list_recipes_list_id", table_name="list_recipes")
    op.drop_table("list_recipes")

    op.drop_index("ix_list_items_list_id", table_name="list_items")
    op.drop_index("ix_list_items_id", table_name="list_items")
    op.drop_table("list_items")

    op.drop_index("ix_saved_recipes_recipe_id", table_name="saved_recipes")
    op.drop_index("ix_saved_recipes_user_id", table_name="saved_recipes")
    op.drop_table("saved_recipes")

    op.drop_index("ix_favorite_recipes_recipe_id", table_name="favorite_recipes")
    op.drop_index("ix_favorite_recipes_user_id", table_name="favorite_recipes")
    op.drop_table("favorite_recipes")

    op.drop_index("ix_recipe_ingredients_recipe_id", table_name="recipe_ingredients")
    op.drop_index("ix_recipe_ingredients_id", table_name="recipe_ingredients")
    op.drop_table("recipe_ingredients")

    op.drop_index("ix_calendar_events_date", table_name="calendar_events")
    op.drop_index("ix_calendar_events_user_id", table_name="calendar_events")
    op.drop_index("ix_calendar_events_id", table_name="calendar_events")
    op.drop_table("calendar_events")

    op.drop_index("ix_lists_user_id", table_name="lists")
    op.drop_index("ix_lists_id", table_name="lists")
    op.drop_table("lists")

    op.drop_index("ix_holidays_slug", table_name="holidays")
    op.drop_index("ix_holidays_id", table_name="holidays")
    op.drop_table("holidays")

    op.drop_index("ix_tags_category", table_name="tags")
    op.drop_index("ix_tags_slug", table_name="tags")
    op.drop_index("ix_tags_id", table_name="tags")
    op.drop_table("tags")

    op.drop_index("ix_recipes_name", table_name="recipes")
    op.drop_index("ix_recipes_id", table_name="recipes")
    op.drop_table("recipes")

    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_clerk_user_id", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
