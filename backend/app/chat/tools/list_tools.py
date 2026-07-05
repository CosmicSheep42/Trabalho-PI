from __future__ import annotations

from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload

from app.api.routes.lists import _get_accessible_list
from app.chat.tool_registry import ToolRegistry
from app.chat.tool_runtime import ToolExecutionContext, ToolExecutionResult
from app.db.session import SessionLocal
from app.models.list_member import ListMember
from app.models.shopping_list import ShoppingList


def register_list_tools(registry: ToolRegistry) -> None:
    registry.register("lists.read.list_user_lists", list_user_lists_tool)
    registry.register("lists.read.get_list_details", get_list_details_tool)
    registry.register("lists.read.find_list_by_name", find_list_by_name_tool)


def list_user_lists_tool(
    context: ToolExecutionContext,
    arguments: dict[str, object],
) -> ToolExecutionResult:
    include_items = _coerce_bool(arguments.get("include_items"), default=False)
    include_collaborators = _coerce_bool(arguments.get("include_collaborators"), default=False)
    limit = _coerce_limit(arguments.get("limit"), default=10)

    with SessionLocal() as db:
        query = (
            db.query(ShoppingList)
            .options(
                selectinload(ShoppingList.user),
                selectinload(ShoppingList.items),
                selectinload(ShoppingList.recipe_links),
                selectinload(ShoppingList.shared_memberships).selectinload(ListMember.user),
            )
            .filter(
                or_(
                    ShoppingList.user_id == context.user_id,
                    ShoppingList.shared_memberships.any(ListMember.user_id == context.user_id),
                )
            )
            .order_by(ShoppingList.id.desc())
            .limit(limit)
        )
        lists = query.all()

    return ToolExecutionResult(
        success=True,
        message=f"Found {len(lists)} accessible list(s).",
        data={
            "lists": [
                _serialize_list_summary(
                    shopping_list,
                    include_items=include_items,
                    include_collaborators=include_collaborators,
                )
                for shopping_list in lists
            ]
        },
    )


def get_list_details_tool(
    context: ToolExecutionContext,
    arguments: dict[str, object],
) -> ToolExecutionResult:
    list_id = _coerce_int(arguments.get("list_id"))
    if list_id is None:
        return ToolExecutionResult(
            success=False,
            message="A list id is required to fetch list details.",
            error="Missing required argument 'list_id'.",
        )

    with SessionLocal() as db:
        try:
            shopping_list = _get_accessible_list(db, context.user_id, list_id)
        except Exception as exc:
            return ToolExecutionResult(
                success=False,
                message="I could not access that list.",
                error=str(exc),
            )

        return ToolExecutionResult(
            success=True,
            message=f"Loaded details for list '{shopping_list.name}'.",
            data={"list": _serialize_list_details(shopping_list)},
        )


def find_list_by_name_tool(
    context: ToolExecutionContext,
    arguments: dict[str, object],
) -> ToolExecutionResult:
    query = str(arguments.get("query") or "").strip()
    if not query:
        return ToolExecutionResult(
            success=False,
            message="A name or partial name is required to search lists.",
            error="Missing required argument 'query'.",
        )

    limit = _coerce_limit(arguments.get("limit"), default=5)

    with SessionLocal() as db:
        lists = (
            db.query(ShoppingList)
            .options(
                selectinload(ShoppingList.user),
                selectinload(ShoppingList.recipe_links),
                selectinload(ShoppingList.shared_memberships).selectinload(ListMember.user),
            )
            .filter(
                or_(
                    ShoppingList.user_id == context.user_id,
                    ShoppingList.shared_memberships.any(ListMember.user_id == context.user_id),
                ),
                func.lower(ShoppingList.name).like(f"%{query.lower()}%"),
            )
            .order_by(func.lower(ShoppingList.name).asc(), ShoppingList.id.asc())
            .limit(limit)
            .all()
        )

    return ToolExecutionResult(
        success=True,
        message=f"Found {len(lists)} matching list(s) for '{query}'.",
        data={
            "query": query,
            "matches": [
                _serialize_list_summary(
                    shopping_list,
                    include_items=False,
                    include_collaborators=True,
                )
                for shopping_list in lists
            ],
        },
    )


def _serialize_list_summary(
    shopping_list: ShoppingList,
    *,
    include_items: bool,
    include_collaborators: bool,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "id": shopping_list.id,
        "name": shopping_list.name,
        "color": shopping_list.color,
        "date": shopping_list.date.isoformat() if shopping_list.date else None,
        "owner": _serialize_user_summary(shopping_list.owner),
        "recipe_ids": shopping_list.recipe_ids,
        "item_count": len(shopping_list.items),
        "collaborator_count": len(shopping_list.collaborators),
    }
    if include_items:
        payload["items"] = [_serialize_item(item) for item in shopping_list.items]
    if include_collaborators:
        payload["collaborators"] = [
            _serialize_user_summary(collaborator)
            for collaborator in shopping_list.collaborators
        ]
    return payload


def _serialize_list_details(shopping_list: ShoppingList) -> dict[str, object]:
    return {
        **_serialize_list_summary(
            shopping_list,
            include_items=True,
            include_collaborators=True,
        ),
        "list_recipes": [
            {
                "recipe_id": link.recipe_id,
                "servings": link.servings,
            }
            for link in shopping_list.list_recipes
        ],
    }


def _serialize_user_summary(user: object) -> dict[str, object] | None:
    if user is None:
        return None
    return {
        "id": getattr(user, "id", None),
        "username": getattr(user, "username", None) or "",
        "clerk_user_id": getattr(user, "clerk_user_id", None),
    }


def _serialize_item(item: object) -> dict[str, object]:
    return {
        "id": getattr(item, "id", None),
        "list_id": getattr(item, "list_id", None),
        "name": getattr(item, "name", None),
        "quantity": getattr(item, "quantity", None),
        "unit": getattr(item, "unit", None),
        "checked": getattr(item, "checked", False),
    }


def _coerce_limit(raw_value: object, *, default: int) -> int:
    value = _coerce_int(raw_value)
    if value is None:
        return default
    return max(1, min(value, 25))


def _coerce_int(raw_value: object) -> int | None:
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
    return None


def _coerce_bool(raw_value: object, *, default: bool) -> bool:
    if isinstance(raw_value, bool):
        return raw_value
    if isinstance(raw_value, str):
        normalized = raw_value.strip().lower()
        if normalized in {"true", "1", "yes", "on"}:
            return True
        if normalized in {"false", "0", "no", "off"}:
            return False
    return default
