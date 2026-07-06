from __future__ import annotations

from sqlalchemy import or_

from app.api.routes.recipes import (
    DIETARY_FILTER_FIELDS,
    _apply_time_filter,
    _build_recipe_query,
    _normalize_slug_filters,
    _serialize_recipe,
)
from app.chat.tool_registry import ToolRegistry
from app.chat.tool_runtime import ToolExecutionContext, ToolExecutionResult
from app.db.session import SessionLocal
from app.models.holiday import Holiday
from app.models.recipe import Recipe
from app.models.recipe_holiday import RecipeHoliday
from app.models.recipe_tag import RecipeTag
from app.models.tag import Tag
from app.models.user import User


def register_recipe_tools(registry: ToolRegistry) -> None:
    registry.register("search_recipes", search_recipes_tool)


def search_recipes_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        current_user = db.query(User).filter(User.id == context.user_id).first()
        if current_user is None:
            return ToolExecutionResult(
                success=False,
                message="Could not load the current user for recipe search.",
                error="User not found.",
            )

        search = _read_optional_string(arguments, "search")
        tags = _read_string_list(arguments, "tags")
        holidays = _read_string_list(arguments, "holidays")
        time_filter = _read_optional_string(arguments, "time_filter")
        limit = _read_limit(arguments.get("limit"))

        query = _build_recipe_query(db, current_user)

        if search:
            like_term = f"%{search}%"
            query = query.filter(or_(Recipe.name.ilike(like_term), Recipe.description.ilike(like_term)))

        if time_filter:
            query = _apply_time_filter(query, time_filter)

        for field_name in DIETARY_FILTER_FIELDS:
            raw_value = arguments.get(field_name)
            if isinstance(raw_value, bool):
                query = query.filter(getattr(Recipe, field_name) == raw_value)

        normalized_tags = _normalize_slug_filters(tags)
        if normalized_tags:
            query = (
                query.join(RecipeTag, RecipeTag.recipe_id == Recipe.id)
                .join(Tag, Tag.id == RecipeTag.tag_id)
                .filter(Tag.slug.in_(normalized_tags))
                .distinct()
            )

        normalized_holidays = _normalize_slug_filters(holidays)
        if normalized_holidays:
            query = (
                query.join(RecipeHoliday, RecipeHoliday.recipe_id == Recipe.id)
                .join(Holiday, Holiday.id == RecipeHoliday.holiday_id)
                .filter(Holiday.slug.in_(normalized_holidays))
                .distinct()
            )

        rows = query.order_by(Recipe.name.asc()).limit(limit).all()
        serialized_cards = [
            _to_recipe_card_payload(
                _serialize_recipe(
                    recipe,
                    average_rating,
                    ratings_count,
                    user_rating,
                    is_favorite,
                    is_saved,
                    saved_servings,
                    saved_notes,
                ).model_dump()
            )
            for recipe, average_rating, ratings_count, user_rating, is_favorite, is_saved, saved_servings, saved_notes in rows
        ]

        if not serialized_cards:
            return ToolExecutionResult(
                success=True,
                message="No recipes matched the current search.",
                data={
                    "type": "recipe_cards",
                    "recipes": [],
                    "applied_filters": _build_applied_filters(arguments, search, normalized_tags, normalized_holidays, time_filter),
                },
            )

        return ToolExecutionResult(
            success=True,
            message=f"Found {len(serialized_cards)} recipe suggestions.",
            data={
                "type": "recipe_cards",
                "recipes": serialized_cards,
                "applied_filters": _build_applied_filters(arguments, search, normalized_tags, normalized_holidays, time_filter),
            },
        )
    finally:
        db.close()


def _to_recipe_card_payload(recipe: dict[str, object]) -> dict[str, object]:
    return {
        "id": recipe["id"],
        "name": recipe["name"],
        "description": recipe["description"],
        "image": recipe["image"],
        "prep_time_minutes": recipe["prep_time_minutes"],
        "servings": recipe["servings"],
        "average_rating": recipe["average_rating"],
        "ratings_count": recipe["ratings_count"],
        "is_favorite": recipe["is_favorite"],
        "is_saved": recipe["is_saved"],
        "vegan": recipe["vegan"],
        "vegetarian": recipe["vegetarian"],
        "lactose_free": recipe["lactose_free"],
        "egg_free": recipe["egg_free"],
        "gluten_free": recipe["gluten_free"],
        "nut_free": recipe["nut_free"],
        "shellfish_free": recipe["shellfish_free"],
        "soy_free": recipe["soy_free"],
        "sesame_free": recipe["sesame_free"],
        "sulfite_free": recipe["sulfite_free"],
        "tags": recipe["tags"],
        "holidays": recipe["holidays"],
    }


def _read_optional_string(arguments: dict[str, object], key: str) -> str | None:
    value = arguments.get(key)
    if not isinstance(value, str):
        return None
    stripped = value.strip()
    return stripped or None


def _read_string_list(arguments: dict[str, object], key: str) -> list[str]:
    value = arguments.get(key)
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def _read_limit(value: object) -> int:
    if isinstance(value, bool):
        return 4
    if isinstance(value, int):
        return max(1, min(value, 8))
    return 4


def _build_applied_filters(
    arguments: dict[str, object],
    search: str | None,
    tags: list[str],
    holidays: list[str],
    time_filter: str | None,
) -> dict[str, object]:
    dietary_filters = {
        field_name: arguments[field_name]
        for field_name in DIETARY_FILTER_FIELDS
        if isinstance(arguments.get(field_name), bool)
    }
    return {
        "search": search,
        "tags": tags,
        "holidays": holidays,
        "time_filter": time_filter,
        "dietary": dietary_filters,
    }
