from __future__ import annotations

from datetime import date as dt_date
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func

from app.api.routes.lists import (
    _get_accessible_item,
    _get_accessible_list,
    _get_accessible_list_query,
    _get_recipe_with_ingredients_or_404,
    _merge_recipe_ingredients_into_list,
    _resolve_list_recipe_servings,
    _subtract_recipe_ingredients_from_list,
    _upsert_saved_recipe,
)
from app.chat.tool_registry import ToolRegistry
from app.chat.tool_runtime import ToolExecutionContext, ToolExecutionResult
from app.core.normalization import normalize_item_name
from app.db.session import SessionLocal
from app.models.list_item import ListItem
from app.models.list_recipe import ListRecipe
from app.models.recipe import Recipe
from app.models.shopping_list import ShoppingList


def register_list_tools(registry: ToolRegistry) -> None:
    registry.register("get_lists", get_lists_tool)
    registry.register("create_list", create_list_tool)
    registry.register("update_list", update_list_tool)
    registry.register("delete_list", delete_list_tool)
    registry.register("create_list_item", create_list_item_tool)
    registry.register("update_list_item", update_list_item_tool)
    registry.register("delete_list_item", delete_list_item_tool)
    registry.register("add_recipe_to_list", add_recipe_to_list_tool)
    registry.register("remove_recipe_from_list", remove_recipe_from_list_tool)


def get_lists_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        limit = _read_optional_int(arguments, "limit")
        name_query = _read_optional_string(arguments, "name_query")
        query = _get_accessible_list_query(db, context.user_id).order_by(ShoppingList.id.desc())
        if name_query is not None:
            like_term = f"%{name_query.lower()}%"
            query = query.filter(func.lower(ShoppingList.name).like(like_term))
        if limit is not None:
            query = query.limit(max(1, min(limit, 20)))
        shopping_lists = query.all()
        return ToolExecutionResult(
            success=True,
            message=f"Found {len(shopping_lists)} lists.",
            data={"type": "shopping_lists", "lists": [_serialize_list(shopping_list) for shopping_list in shopping_lists]},
        )
    finally:
        db.close()


def create_list_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        name = _read_required_string(arguments, "name")
        color = _read_required_string(arguments, "color")
        date_value = _read_optional_date(arguments, "date")

        shopping_list = ShoppingList(user_id=context.user_id, name=name, color=color, date=date_value)
        db.add(shopping_list)
        db.commit()
        created_list = _get_accessible_list(db, context.user_id, shopping_list.id)
        return ToolExecutionResult(
            success=True,
            message=f"Created list '{created_list.name}'.",
            data={"type": "shopping_list", "list": _serialize_list(created_list)},
        )
    except HTTPException as exc:
        return _http_error_result("Could not create the list.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not create the list.", exc)
    finally:
        db.close()


def update_list_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        shopping_list = _resolve_list(db, context.user_id, arguments)

        changed = False
        name = _read_optional_string(arguments, "new_name")
        if name is not None:
            shopping_list.name = name
            changed = True

        color = _read_optional_string(arguments, "new_color")
        if color is not None:
            shopping_list.color = color
            changed = True

        if "new_date" in arguments:
            shopping_list.date = _read_optional_date(arguments, "new_date")
            changed = True

        if not changed:
            return ToolExecutionResult(
                success=False,
                message="No list fields were provided to update.",
                error="Expected at least one of: new_name, new_color, new_date.",
            )

        db.add(shopping_list)
        db.commit()
        updated_list = _get_accessible_list(db, context.user_id, shopping_list.id)
        return ToolExecutionResult(
            success=True,
            message=f"Updated list '{updated_list.name}'.",
            data={"type": "shopping_list", "list": _serialize_list(updated_list)},
        )
    except HTTPException as exc:
        return _http_error_result("Could not update the list.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not update the list.", exc)
    finally:
        db.close()


def delete_list_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        if _read_optional_bool(arguments, "delete_all") is True:
            shopping_lists = _get_accessible_list_query(db, context.user_id).all()
            deleted_lists = [{"id": shopping_list.id, "name": shopping_list.name} for shopping_list in shopping_lists]
            for shopping_list in shopping_lists:
                db.delete(shopping_list)
            db.commit()
            return ToolExecutionResult(
                success=True,
                message=f"Deleted {len(deleted_lists)} lists.",
                data={"type": "delete_result", "deleted": True, "deleted_lists": deleted_lists},
            )

        shopping_list = _resolve_list(db, context.user_id, arguments)
        deleted_name = shopping_list.name
        deleted_list_id = shopping_list.id
        db.delete(shopping_list)
        db.commit()
        return ToolExecutionResult(
            success=True,
            message=f"Deleted list '{deleted_name}'.",
            data={"type": "delete_result", "deleted": True, "list_id": deleted_list_id, "list_name": deleted_name},
        )
    except HTTPException as exc:
        return _http_error_result("Could not delete the list.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not delete the list.", exc)
    finally:
        db.close()


def create_list_item_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        shopping_list = _resolve_list(db, context.user_id, arguments)

        item = ListItem(
            list_id=shopping_list.id,
            name=_read_required_string(arguments, "item_name"),
            quantity=_read_optional_number(arguments, "quantity"),
            unit=_read_optional_string(arguments, "unit"),
            checked=_read_optional_bool(arguments, "checked") or False,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return ToolExecutionResult(
            success=True,
            message=f"Added item '{item.name}' to the list.",
            data={"type": "list_item", "item": _serialize_item(item)},
        )
    except HTTPException as exc:
        return _http_error_result("Could not add the list item.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not add the list item.", exc)
    finally:
        db.close()


def update_list_item_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        item = _resolve_list_item(db, context.user_id, arguments)
        changed = False

        name = _read_optional_string(arguments, "new_item_name")
        if name is not None:
            item.name = name
            changed = True

        if "quantity" in arguments:
            item.quantity = _read_optional_number(arguments, "quantity")
            changed = True

        if "unit" in arguments:
            item.unit = _read_optional_string(arguments, "unit")
            changed = True

        checked = _read_optional_bool(arguments, "checked")
        if checked is not None:
            item.checked = checked
            changed = True

        if not changed:
            return ToolExecutionResult(
                success=False,
                message="No item fields were provided to update.",
                error="Expected at least one of: new_item_name, quantity, unit, checked.",
            )

        db.add(item)
        db.commit()
        db.refresh(item)
        return ToolExecutionResult(
            success=True,
            message=f"Updated item '{item.name}'.",
            data={"type": "list_item", "item": _serialize_item(item)},
        )
    except HTTPException as exc:
        return _http_error_result("Could not update the list item.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not update the list item.", exc)
    finally:
        db.close()


def delete_list_item_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        item = _resolve_list_item(db, context.user_id, arguments)
        deleted_name = item.name
        list_id = item.list_id
        item_id = item.id
        db.delete(item)
        db.commit()
        return ToolExecutionResult(
            success=True,
            message=f"Deleted item '{deleted_name}'.",
            data={"type": "delete_result", "deleted": True, "item_id": item_id, "list_id": list_id},
        )
    except HTTPException as exc:
        return _http_error_result("Could not delete the list item.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not delete the list item.", exc)
    finally:
        db.close()


def add_recipe_to_list_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        shopping_list = _resolve_list(db, context.user_id, arguments)
        recipe = _resolve_recipe(db, arguments)
        list_id = shopping_list.id
        recipe_id = recipe.id
        resolved_servings = _resolve_list_recipe_servings(_read_optional_int(arguments, "servings"), recipe.servings)

        existing_link = (
            db.query(ListRecipe)
            .filter(ListRecipe.list_id == list_id, ListRecipe.recipe_id == recipe_id)
            .first()
        )
        if existing_link is not None:
            _upsert_saved_recipe(db, context.user_id, recipe_id, resolved_servings)
            if existing_link.servings != resolved_servings:
                _subtract_recipe_ingredients_from_list(db, shopping_list, recipe, existing_link.servings)
                existing_link.servings = resolved_servings
                _merge_recipe_ingredients_into_list(db, shopping_list, recipe, existing_link.servings)
                db.add(existing_link)
            db.commit()
            updated_list = _get_accessible_list(db, context.user_id, list_id)
            return ToolExecutionResult(
                success=True,
                message=f"Updated recipe {recipe_id} in list '{updated_list.name}'.",
                data={"type": "shopping_list", "list": _serialize_list(updated_list)},
            )

        db.add(ListRecipe(list_id=list_id, recipe_id=recipe_id, servings=resolved_servings))
        _merge_recipe_ingredients_into_list(db, shopping_list, recipe, resolved_servings)
        _upsert_saved_recipe(db, context.user_id, recipe_id, resolved_servings)
        db.commit()
        updated_list = _get_accessible_list(db, context.user_id, list_id)
        return ToolExecutionResult(
            success=True,
            message=f"Added recipe {recipe_id} to list '{updated_list.name}'.",
            data={"type": "shopping_list", "list": _serialize_list(updated_list)},
        )
    except HTTPException as exc:
        return _http_error_result("Could not add the recipe to the list.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not add the recipe to the list.", exc)
    finally:
        db.close()


def remove_recipe_from_list_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        shopping_list = _resolve_list(db, context.user_id, arguments)
        recipe = _resolve_recipe(db, arguments)
        list_id = shopping_list.id
        recipe_id = recipe.id

        link = (
            db.query(ListRecipe)
            .filter(ListRecipe.list_id == list_id, ListRecipe.recipe_id == recipe_id)
            .first()
        )
        if link is not None:
            db.delete(link)
            _subtract_recipe_ingredients_from_list(db, shopping_list, recipe, link.servings)
            db.commit()

        updated_list = _get_accessible_list(db, context.user_id, list_id)
        return ToolExecutionResult(
            success=True,
            message=f"Removed recipe {recipe_id} from list '{updated_list.name}'.",
            data={"type": "shopping_list", "list": _serialize_list(updated_list)},
        )
    except HTTPException as exc:
        return _http_error_result("Could not remove the recipe from the list.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not remove the recipe from the list.", exc)
    finally:
        db.close()


def _serialize_list(shopping_list: ShoppingList) -> dict[str, Any]:
    return {
        "id": shopping_list.id,
        "name": shopping_list.name,
        "color": shopping_list.color,
        "date": shopping_list.date.isoformat() if shopping_list.date is not None else None,
        "owner": _serialize_user_summary(shopping_list.owner),
        "collaborators": [_serialize_user_summary(user) for user in shopping_list.collaborators],
        "items": [_serialize_item(item) for item in shopping_list.items],
        "recipe_ids": shopping_list.recipe_ids,
        "list_recipes": [
            {"recipe_id": link.recipe_id, "servings": link.servings}
            for link in shopping_list.list_recipes
        ],
    }


def _serialize_item(item: ListItem) -> dict[str, Any]:
    return {
        "id": item.id,
        "list_id": item.list_id,
        "name": item.name,
        "quantity": item.quantity,
        "unit": item.unit,
        "checked": item.checked,
    }


def _serialize_user_summary(user: Any) -> dict[str, Any] | None:
    if user is None:
        return None
    return {
        "id": user.id,
        "username": user.username,
        "clerk_user_id": user.clerk_user_id,
    }


def _resolve_list(db, user_id: int, arguments: dict[str, object]) -> ShoppingList:
    list_id = _read_optional_int(arguments, "list_id")
    if list_id is not None:
        return _get_accessible_list(db, user_id, list_id)

    list_name = _read_optional_string(arguments, "list_name")
    if list_name is None:
        raise ValueError("Provide 'list_name' for natural-language list operations.")

    matches = (
        _get_accessible_list_query(db, user_id)
        .filter(func.lower(ShoppingList.name) == list_name.lower())
        .order_by(ShoppingList.id.desc())
        .all()
    )
    if not matches:
        partial_matches = (
            _get_accessible_list_query(db, user_id)
            .filter(func.lower(ShoppingList.name).like(f"%{list_name.lower()}%"))
            .order_by(ShoppingList.id.desc())
            .all()
        )
        matches = partial_matches

    return _resolve_single_match(matches, "list", list_name)


def _resolve_list_item(db, user_id: int, arguments: dict[str, object]) -> ListItem:
    item_id = _read_optional_int(arguments, "item_id")
    if item_id is not None:
        return _get_accessible_item(db, user_id, item_id)

    shopping_list = _resolve_list(db, user_id, arguments)
    item_name = _read_optional_string(arguments, "item_name")
    if item_name is None:
        raise ValueError("Provide 'item_name' for natural-language item operations.")

    normalized_target = normalize_item_name(item_name)
    exact_matches = [
        item for item in shopping_list.items if normalize_item_name(item.name) == normalized_target
    ]
    if exact_matches:
        return _resolve_single_match(exact_matches, "list item", item_name)

    partial_matches = [
        item for item in shopping_list.items if normalized_target in normalize_item_name(item.name)
    ]
    return _resolve_single_match(partial_matches, "list item", item_name)


def _resolve_recipe(db, arguments: dict[str, object]) -> Recipe:
    recipe_id = _read_optional_int(arguments, "recipe_id")
    if recipe_id is not None:
        return _get_recipe_with_ingredients_or_404(db, recipe_id)

    recipe_name = _read_optional_string(arguments, "recipe_name")
    if recipe_name is None:
        raise ValueError("Provide 'recipe_name' for natural-language recipe operations.")

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


def _read_required_string(arguments: dict[str, object], key: str) -> str:
    value = _read_optional_string(arguments, key)
    if value is None:
        raise ValueError(f"'{key}' must be a non-empty string.")
    return value


def _read_optional_string(arguments: dict[str, object], key: str) -> str | None:
    value = arguments.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(f"'{key}' must be a string.")
    stripped = value.strip()
    if not stripped:
        return None
    return stripped


def _read_required_int(arguments: dict[str, object], key: str) -> int:
    value = _read_optional_int(arguments, key)
    if value is None:
        raise ValueError(f"'{key}' must be an integer.")
    return value


def _read_optional_int(arguments: dict[str, object], key: str) -> int | None:
    value = arguments.get(key)
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"'{key}' must be an integer.")
    return value


def _read_optional_number(arguments: dict[str, object], key: str) -> float | None:
    value = arguments.get(key)
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"'{key}' must be a number.")
    return float(value)


def _read_optional_bool(arguments: dict[str, object], key: str) -> bool | None:
    value = arguments.get(key)
    if value is None:
        return None
    if not isinstance(value, bool):
        raise ValueError(f"'{key}' must be a boolean.")
    return value


def _read_optional_date(arguments: dict[str, object], key: str) -> dt_date | None:
    value = arguments.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(f"'{key}' must be an ISO date string or null.")
    stripped = value.strip()
    if not stripped:
        return None
    try:
        return dt_date.fromisoformat(stripped)
    except ValueError as exc:
        raise ValueError(f"'{key}' must be a valid ISO date in YYYY-MM-DD format.") from exc


def _http_error_result(message: str, exc: HTTPException) -> ToolExecutionResult:
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return ToolExecutionResult(success=False, message=message, error=detail)


def _validation_error_result(message: str, exc: ValueError) -> ToolExecutionResult:
    return ToolExecutionResult(success=False, message=message, error=str(exc))
