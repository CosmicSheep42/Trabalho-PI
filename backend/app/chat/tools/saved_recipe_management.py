from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import func

from app.api.routes.recipes import _build_recipe_query, _get_recipe_or_404, _serialize_recipe
from app.chat.tool_registry import ToolRegistry
from app.chat.tool_runtime import ToolExecutionContext, ToolExecutionResult
from app.db.session import SessionLocal
from app.models.recipe import Recipe
from app.models.saved_recipe import SavedRecipe
from app.models.user import User


def register_saved_recipe_tools(registry: ToolRegistry) -> None:
    registry.register("get_saved_recipes", get_saved_recipes_tool)
    registry.register("save_recipe", save_recipe_tool)
    registry.register("remove_saved_recipe", remove_saved_recipe_tool)


def get_saved_recipes_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        current_user = _get_current_user(db, context.user_id)
        name_query = _read_optional_string(arguments, "name_query")
        limit = _read_optional_int(arguments, "limit")

        query = (
            _build_recipe_query(db, current_user)
            .join(SavedRecipe, SavedRecipe.recipe_id == Recipe.id)
            .filter(SavedRecipe.user_id == current_user.id)
            .order_by(Recipe.name.asc())
        )
        if name_query is not None:
            like_term = f"%{name_query.lower()}%"
            query = query.filter(func.lower(Recipe.name).like(like_term))
        if limit is not None:
            query = query.limit(max(1, min(limit, 20)))

        rows = query.all()
        recipes = [
            _to_saved_recipe_card(
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
        return ToolExecutionResult(
            success=True,
            message=f"Found {len(recipes)} saved recipes.",
            data={"type": "saved_recipes", "recipes": recipes},
        )
    except HTTPException as exc:
        return _http_error_result("Could not load saved recipes.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not load saved recipes.", exc)
    finally:
        db.close()


def save_recipe_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        recipe = _resolve_recipe(db, arguments)
        servings = _read_optional_int(arguments, "servings")
        notes = _read_optional_nullable_string(arguments, "notes")

        saved_recipe = (
            db.query(SavedRecipe)
            .filter(SavedRecipe.recipe_id == recipe.id, SavedRecipe.user_id == context.user_id)
            .first()
        )
        resolved_servings = servings if servings is not None else recipe.servings

        if saved_recipe is not None:
            if "servings" in arguments:
                saved_recipe.servings = resolved_servings
            if "notes" in arguments:
                saved_recipe.notes = notes
            db.add(saved_recipe)
        else:
            saved_recipe = SavedRecipe(
                user_id=context.user_id,
                recipe_id=recipe.id,
                servings=resolved_servings,
                notes=notes if "notes" in arguments else None,
            )
            db.add(saved_recipe)

        db.commit()
        return ToolExecutionResult(
            success=True,
            message=f"Saved recipe '{recipe.name}'.",
            data={
                "type": "saved_recipe",
                "recipe_id": recipe.id,
                "recipe_name": recipe.name,
                "servings": saved_recipe.servings,
                "notes": saved_recipe.notes,
            },
        )
    except HTTPException as exc:
        return _http_error_result("Could not save the recipe.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not save the recipe.", exc)
    finally:
        db.close()


def remove_saved_recipe_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        if _read_optional_bool(arguments, "delete_all") is True:
            deleted_rows = (
                db.query(SavedRecipe)
                .filter(SavedRecipe.user_id == context.user_id)
                .delete(synchronize_session=False)
            )
            db.commit()
            return ToolExecutionResult(
                success=True,
                message=f"Removed {deleted_rows} saved recipes.",
                data={
                    "type": "saved_recipe_delete_result",
                    "deleted": True,
                    "delete_all": True,
                    "deleted_count": deleted_rows,
                },
            )

        recipe = _resolve_recipe(db, arguments)
        (
            db.query(SavedRecipe)
            .filter(SavedRecipe.recipe_id == recipe.id, SavedRecipe.user_id == context.user_id)
            .delete(synchronize_session=False)
        )
        db.commit()
        return ToolExecutionResult(
            success=True,
            message=f"Removed saved recipe '{recipe.name}'.",
            data={
                "type": "saved_recipe",
                "recipe_id": recipe.id,
                "recipe_name": recipe.name,
                "servings": None,
                "notes": None,
            },
        )
    except HTTPException as exc:
        return _http_error_result("Could not remove the saved recipe.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not remove the saved recipe.", exc)
    finally:
        db.close()


def _resolve_recipe(db, arguments: dict[str, object]) -> Recipe:
    recipe_id = _read_optional_int(arguments, "recipe_id")
    if recipe_id is not None:
        return _get_recipe_or_404(db, recipe_id)

    recipe_name = _read_optional_string(arguments, "recipe_name")
    if recipe_name is None:
        raise ValueError("Provide 'recipe_name' for natural-language saved recipe operations.")

    exact_matches = (
        db.query(Recipe)
        .filter(func.lower(Recipe.name) == recipe_name.lower())
        .order_by(Recipe.id.asc())
        .all()
    )
    if exact_matches:
        return _resolve_single_match(exact_matches, "recipe", recipe_name)

    partial_matches = (
        db.query(Recipe)
        .filter(func.lower(Recipe.name).like(f"%{recipe_name.lower()}%"))
        .order_by(Recipe.id.asc())
        .all()
    )
    return _resolve_single_match(partial_matches, "recipe", recipe_name)


def _get_current_user(db, user_id: int) -> User:
    current_user = db.query(User).filter(User.id == user_id).first()
    if current_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return current_user


def _to_saved_recipe_card(recipe: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": recipe["id"],
        "name": recipe["name"],
        "description": recipe["description"],
        "image": recipe["image"],
        "prep_time_minutes": recipe["prep_time_minutes"],
        "servings": recipe["servings"],
        "saved_servings": recipe["saved_servings"],
        "saved_notes": recipe["saved_notes"],
        "is_saved": recipe["is_saved"],
    }


def _resolve_single_match(matches: list[Any], entity_label: str, requested_name: str) -> Any:
    if not matches:
        raise ValueError(f"No {entity_label} matched '{requested_name}'.")
    if len(matches) > 1:
        candidate_names = ", ".join(_display_name(match) for match in matches[:5])
        raise ValueError(
            f"Multiple {entity_label}s matched '{requested_name}': {candidate_names}. Be more specific."
        )
    return matches[0]


def _display_name(entity: Any) -> str:
    if hasattr(entity, "name"):
        return str(entity.name)
    return str(getattr(entity, "id", entity))


def _read_optional_string(arguments: dict[str, object], key: str) -> str | None:
    value = arguments.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(f"'{key}' must be a string.")
    stripped = value.strip()
    return stripped or None


def _read_optional_nullable_string(arguments: dict[str, object], key: str) -> str | None:
    value = arguments.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(f"'{key}' must be a string or null.")
    return value.strip() or None


def _read_optional_int(arguments: dict[str, object], key: str) -> int | None:
    value = arguments.get(key)
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"'{key}' must be an integer.")
    return value


def _read_optional_bool(arguments: dict[str, object], key: str) -> bool | None:
    value = arguments.get(key)
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes", "on"}:
            return True
        if normalized in {"false", "0", "no", "off"}:
            return False
    raise ValueError(f"'{key}' must be a boolean.")


def _http_error_result(message: str, exc: HTTPException) -> ToolExecutionResult:
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return ToolExecutionResult(success=False, message=message, error=detail)


def _validation_error_result(message: str, exc: ValueError) -> ToolExecutionResult:
    return ToolExecutionResult(success=False, message=message, error=str(exc))
