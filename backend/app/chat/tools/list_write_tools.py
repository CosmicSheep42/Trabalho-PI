from __future__ import annotations

from pydantic import ValidationError

from app.api.routes.lists import (
    _get_accessible_item,
    _get_accessible_list,
    _get_recipe_with_ingredients_or_404,
    _merge_recipe_ingredients_into_list,
    _resolve_list_recipe_servings,
    _subtract_recipe_ingredients_from_list,
    _upsert_saved_recipe,
)
from app.chat.tool_registry import ToolRegistry
from app.chat.tool_runtime import ToolExecutionContext, ToolExecutionResult
from app.chat.tools.list_tools import _serialize_item, _serialize_list_details
from app.db.session import SessionLocal
from app.models.list_item import ListItem
from app.models.list_recipe import ListRecipe
from app.models.shopping_list import ShoppingList
from app.schemas.list import ListItemCreate, ListItemUpdate, ListRecipeCreate, ShoppingListCreate, ShoppingListUpdate


def register_list_write_tools(registry: ToolRegistry) -> None:
    registry.register("lists.write.create_list", create_list_tool)
    registry.register("lists.write.update_list", update_list_tool)
    registry.register("lists.write.delete_list", delete_list_tool)
    registry.register("lists.write.add_list_item", add_list_item_tool)
    registry.register("lists.write.update_list_item", update_list_item_tool)
    registry.register("lists.write.remove_list_item", remove_list_item_tool)
    registry.register("lists.write.add_recipe_to_list", add_recipe_to_list_tool)
    registry.register("lists.write.update_recipe_servings_in_list", update_recipe_servings_in_list_tool)
    registry.register("lists.write.remove_recipe_from_list", remove_recipe_from_list_tool)


def create_list_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    try:
        payload = ShoppingListCreate.model_validate(arguments)
    except ValidationError as exc:
        return _validation_error_result("I could not create the list with the given fields.", exc)

    with SessionLocal() as db:
        shopping_list = ShoppingList(user_id=context.user_id, **payload.model_dump())
        db.add(shopping_list)
        db.commit()
        db.refresh(shopping_list)
        shopping_list = _get_accessible_list(db, context.user_id, shopping_list.id)

        return ToolExecutionResult(
            success=True,
            message=f"Created list '{shopping_list.name}'.",
            data={"list": _serialize_list_details(shopping_list)},
        )


def update_list_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    list_id = _require_int(arguments.get("list_id"), "list_id")
    if list_id is None:
        return _missing_argument_result("list_id")

    update_fields = {
        key: value
        for key, value in arguments.items()
        if key in {"name", "color", "date"} and value is not None
    }
    try:
        payload = ShoppingListUpdate.model_validate(update_fields)
    except ValidationError as exc:
        return _validation_error_result("I could not update the list with the given fields.", exc)

    with SessionLocal() as db:
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(shopping_list, field, value)
        db.add(shopping_list)
        db.commit()
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        return ToolExecutionResult(
            success=True,
            message=f"Updated list '{shopping_list.name}'.",
            data={"list": _serialize_list_details(shopping_list)},
        )


def delete_list_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    list_id = _require_int(arguments.get("list_id"), "list_id")
    if list_id is None:
        return _missing_argument_result("list_id")

    with SessionLocal() as db:
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        list_name = shopping_list.name
        db.delete(shopping_list)
        db.commit()
        return ToolExecutionResult(
            success=True,
            message=f"Deleted list '{list_name}'.",
            data={"list_id": list_id},
        )


def add_list_item_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    list_id = _require_int(arguments.get("list_id"), "list_id")
    if list_id is None:
        return _missing_argument_result("list_id")

    item_fields = {
        key: value
        for key, value in arguments.items()
        if key in {"name", "quantity", "unit", "checked"}
    }
    try:
        payload = ListItemCreate.model_validate(item_fields)
    except ValidationError as exc:
        return _validation_error_result("I could not add the list item with the given fields.", exc)

    with SessionLocal() as db:
        _get_accessible_list(db, context.user_id, list_id)
        item = ListItem(list_id=list_id, **payload.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return ToolExecutionResult(
            success=True,
            message=f"Added item '{item.name}' to the list.",
            data={"item": _serialize_item(item)},
        )


def update_list_item_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    item_id = _require_int(arguments.get("item_id"), "item_id")
    if item_id is None:
        return _missing_argument_result("item_id")

    item_fields = {
        key: value
        for key, value in arguments.items()
        if key in {"name", "quantity", "unit", "checked"} and value is not None
    }
    try:
        payload = ListItemUpdate.model_validate(item_fields)
    except ValidationError as exc:
        return _validation_error_result("I could not update the list item with the given fields.", exc)

    with SessionLocal() as db:
        item = _get_accessible_item(db, context.user_id, item_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        db.add(item)
        db.commit()
        db.refresh(item)
        return ToolExecutionResult(
            success=True,
            message=f"Updated item '{item.name}'.",
            data={"item": _serialize_item(item)},
        )


def remove_list_item_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    item_id = _require_int(arguments.get("item_id"), "item_id")
    if item_id is None:
        return _missing_argument_result("item_id")

    with SessionLocal() as db:
        item = _get_accessible_item(db, context.user_id, item_id)
        item_name = item.name
        db.delete(item)
        db.commit()
        return ToolExecutionResult(
            success=True,
            message=f"Removed item '{item_name}' from the list.",
            data={"item_id": item_id},
        )


def add_recipe_to_list_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    return _upsert_recipe_link(context, arguments, update_only=False)


def update_recipe_servings_in_list_tool(
    context: ToolExecutionContext,
    arguments: dict[str, object],
) -> ToolExecutionResult:
    return _upsert_recipe_link(context, arguments, update_only=True)


def remove_recipe_from_list_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    list_id = _require_int(arguments.get("list_id"), "list_id")
    recipe_id = _require_int(arguments.get("recipe_id"), "recipe_id")
    if list_id is None:
        return _missing_argument_result("list_id")
    if recipe_id is None:
        return _missing_argument_result("recipe_id")

    with SessionLocal() as db:
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        recipe = _get_recipe_with_ingredients_or_404(db, recipe_id)
        link = (
            db.query(ListRecipe)
            .filter(ListRecipe.list_id == list_id, ListRecipe.recipe_id == recipe_id)
            .first()
        )
        if link is None:
            return ToolExecutionResult(
                success=False,
                message="That recipe is not linked to the target list.",
                error="Recipe link not found.",
            )

        db.delete(link)
        _subtract_recipe_ingredients_from_list(db, shopping_list, recipe, link.servings)
        db.commit()
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        return ToolExecutionResult(
            success=True,
            message=f"Removed recipe {recipe_id} from list '{shopping_list.name}'.",
            data={"list": _serialize_list_details(shopping_list)},
        )


def _upsert_recipe_link(
    context: ToolExecutionContext,
    arguments: dict[str, object],
    *,
    update_only: bool,
) -> ToolExecutionResult:
    list_id = _require_int(arguments.get("list_id"), "list_id")
    recipe_id = _require_int(arguments.get("recipe_id"), "recipe_id")
    if list_id is None:
        return _missing_argument_result("list_id")
    if recipe_id is None:
        return _missing_argument_result("recipe_id")

    payload_fields = {}
    if "servings" in arguments:
        payload_fields["servings"] = arguments.get("servings")
    try:
        payload = ListRecipeCreate.model_validate(payload_fields)
    except ValidationError as exc:
        return _validation_error_result("I could not use the given servings value.", exc)

    with SessionLocal() as db:
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        recipe = _get_recipe_with_ingredients_or_404(db, recipe_id)
        resolved_servings = _resolve_list_recipe_servings(payload.servings, recipe.servings)

        existing_link = (
            db.query(ListRecipe)
            .filter(ListRecipe.list_id == list_id, ListRecipe.recipe_id == recipe_id)
            .first()
        )
        if existing_link is None and update_only:
            return ToolExecutionResult(
                success=False,
                message="That recipe is not linked to the target list yet.",
                error="Recipe link not found.",
            )

        if existing_link is not None:
            _upsert_saved_recipe(db, context.user_id, recipe_id, resolved_servings)
            if existing_link.servings != resolved_servings:
                _subtract_recipe_ingredients_from_list(db, shopping_list, recipe, existing_link.servings)
                existing_link.servings = resolved_servings
                _merge_recipe_ingredients_into_list(db, shopping_list, recipe, existing_link.servings)
                db.add(existing_link)
            db.commit()
            shopping_list = _get_accessible_list(db, context.user_id, list_id)
            return ToolExecutionResult(
                success=True,
                message=f"Updated recipe {recipe_id} in list '{shopping_list.name}'.",
                data={"list": _serialize_list_details(shopping_list)},
            )

        db.add(ListRecipe(list_id=list_id, recipe_id=recipe_id, servings=resolved_servings))
        _merge_recipe_ingredients_into_list(db, shopping_list, recipe, resolved_servings)
        _upsert_saved_recipe(db, context.user_id, recipe_id, resolved_servings)
        db.commit()
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        return ToolExecutionResult(
            success=True,
            message=f"Added recipe {recipe_id} to list '{shopping_list.name}'.",
            data={"list": _serialize_list_details(shopping_list)},
        )


def _missing_argument_result(argument_name: str) -> ToolExecutionResult:
    return ToolExecutionResult(
        success=False,
        message=f"A valid {argument_name} is required.",
        error=f"Missing required argument '{argument_name}'.",
    )


def _require_int(raw_value: object, argument_name: str) -> int | None:
    if isinstance(raw_value, bool) or raw_value is None:
        return None
    if isinstance(raw_value, int):
        return raw_value
    if isinstance(raw_value, float):
        return int(raw_value)
    if isinstance(raw_value, str):
        stripped = raw_value.strip()
        if not stripped:
            return None
        try:
            return int(stripped)
        except ValueError:
            return None
    raise ValueError(f"Unsupported value for {argument_name}.")


def _validation_error_result(message: str, exc: ValidationError) -> ToolExecutionResult:
    return ToolExecutionResult(
        success=False,
        message=message,
        error=exc.errors()[0]["msg"] if exc.errors() else str(exc),
    )
