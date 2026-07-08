from __future__ import annotations

from datetime import date as dt_date
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func

from app.api.routes.events import _get_owned_event, _get_owned_event_query, _set_event_lists
from app.api.routes.lists import _get_accessible_list_query
from app.chat.tool_registry import ToolRegistry
from app.chat.tool_runtime import ToolExecutionContext, ToolExecutionResult
from app.db.session import SessionLocal
from app.models.calendar_event import CalendarEvent
from app.models.shopping_list import ShoppingList


def register_event_tools(registry: ToolRegistry) -> None:
    registry.register("get_events", get_events_tool)
    registry.register("create_event", create_event_tool)
    registry.register("update_event", update_event_tool)
    registry.register("delete_event", delete_event_tool)
    registry.register("add_lists_to_event", add_lists_to_event_tool)
    registry.register("remove_lists_from_event", remove_lists_from_event_tool)


def get_events_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        limit = _read_optional_int(arguments, "limit")
        name_query = _read_optional_string(arguments, "name_query")
        date_value = _read_optional_date(arguments, "date")

        query = _get_owned_event_query(db, context.user_id).order_by(CalendarEvent.date.asc(), CalendarEvent.id.asc())
        if name_query is not None:
            query = query.filter(func.lower(CalendarEvent.name).like(f"%{name_query.lower()}%"))
        if date_value is not None:
            query = query.filter(CalendarEvent.date == date_value)
        if limit is not None:
            query = query.limit(max(1, min(limit, 20)))

        events = query.all()
        return ToolExecutionResult(
            success=True,
            message=f"Found {len(events)} events.",
            data={"type": "calendar_events", "events": [_serialize_event(event) for event in events]},
        )
    finally:
        db.close()


def create_event_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        calendar_event = CalendarEvent(
            user_id=context.user_id,
            name=_read_required_string(arguments, "name"),
            description=_read_optional_string(arguments, "description") or "",
            icon=_read_required_string(arguments, "icon"),
            date=_read_required_date(arguments, "date"),
        )
        list_names = _read_string_list(arguments, "list_names")
        list_ids = _resolve_list_ids(db, context.user_id, list_names)
        _set_event_lists(db, calendar_event, context.user_id, list_ids)
        db.commit()
        created_event = _get_owned_event(db, context.user_id, calendar_event.id)
        return ToolExecutionResult(
            success=True,
            message=f"Created event '{created_event.name}'.",
            data={"type": "calendar_event", "event": _serialize_event(created_event)},
        )
    except HTTPException as exc:
        return _http_error_result("Could not create the event.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not create the event.", exc)
    finally:
        db.close()


def update_event_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        calendar_event = _resolve_event(db, context.user_id, arguments)
        changed = False

        new_name = _read_optional_string(arguments, "new_name")
        if new_name is not None:
            calendar_event.name = new_name
            changed = True

        if "description" in arguments:
            calendar_event.description = _read_optional_string(arguments, "description") or ""
            changed = True

        new_icon = _read_optional_string(arguments, "new_icon")
        if new_icon is not None:
            calendar_event.icon = new_icon
            changed = True

        if "new_date" in arguments:
            calendar_event.date = _read_required_date(arguments, "new_date")
            changed = True

        if "list_names" in arguments:
            list_ids = _resolve_list_ids(db, context.user_id, _read_string_list(arguments, "list_names"))
            _set_event_lists(db, calendar_event, context.user_id, list_ids)
            changed = True

        if not changed:
            return ToolExecutionResult(
                success=False,
                message="No event fields were provided to update.",
                error="Expected at least one of: new_name, description, new_icon, new_date, list_names.",
            )

        db.add(calendar_event)
        db.commit()
        updated_event = _get_owned_event(db, context.user_id, calendar_event.id)
        return ToolExecutionResult(
            success=True,
            message=f"Updated event '{updated_event.name}'.",
            data={"type": "calendar_event", "event": _serialize_event(updated_event)},
        )
    except HTTPException as exc:
        return _http_error_result("Could not update the event.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not update the event.", exc)
    finally:
        db.close()


def delete_event_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        if _read_optional_bool(arguments, "delete_all") is True:
            events = _get_owned_event_query(db, context.user_id).all()
            deleted_events = [{"id": event.id, "name": event.name} for event in events]
            for event in events:
                db.delete(event)
            db.commit()
            return ToolExecutionResult(
                success=True,
                message=f"Deleted {len(deleted_events)} events.",
                data={"type": "delete_result", "deleted": True, "deleted_events": deleted_events},
            )

        calendar_event = _resolve_event(db, context.user_id, arguments)
        deleted_name = calendar_event.name
        deleted_id = calendar_event.id
        db.delete(calendar_event)
        db.commit()
        return ToolExecutionResult(
            success=True,
            message=f"Deleted event '{deleted_name}'.",
            data={"type": "delete_result", "deleted": True, "event_id": deleted_id, "event_name": deleted_name},
        )
    except HTTPException as exc:
        return _http_error_result("Could not delete the event.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not delete the event.", exc)
    finally:
        db.close()


def add_lists_to_event_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        calendar_event = _resolve_event(db, context.user_id, arguments)
        current_list_ids = list(calendar_event.list_ids)
        additional_names = _read_required_string_list(arguments, "list_names")
        additional_ids = _resolve_list_ids(db, context.user_id, additional_names)
        merged_ids = sorted(set(current_list_ids) | set(additional_ids))
        _set_event_lists(db, calendar_event, context.user_id, merged_ids)
        db.commit()
        updated_event = _get_owned_event(db, context.user_id, calendar_event.id)
        return ToolExecutionResult(
            success=True,
            message=f"Added {len(additional_ids)} list links to event '{updated_event.name}'.",
            data={"type": "calendar_event", "event": _serialize_event(updated_event)},
        )
    except HTTPException as exc:
        return _http_error_result("Could not add lists to the event.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not add lists to the event.", exc)
    finally:
        db.close()


def remove_lists_from_event_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    db = SessionLocal()
    try:
        calendar_event = _resolve_event(db, context.user_id, arguments)
        remove_names = _read_required_string_list(arguments, "list_names")
        remove_ids = set(_resolve_list_ids(db, context.user_id, remove_names))
        remaining_ids = [list_id for list_id in calendar_event.list_ids if list_id not in remove_ids]
        _set_event_lists(db, calendar_event, context.user_id, remaining_ids)
        db.commit()
        updated_event = _get_owned_event(db, context.user_id, calendar_event.id)
        return ToolExecutionResult(
            success=True,
            message=f"Removed {len(remove_ids)} list links from event '{updated_event.name}'.",
            data={"type": "calendar_event", "event": _serialize_event(updated_event)},
        )
    except HTTPException as exc:
        return _http_error_result("Could not remove lists from the event.", exc)
    except ValueError as exc:
        return _validation_error_result("Could not remove lists from the event.", exc)
    finally:
        db.close()


def _resolve_event(db, user_id: int, arguments: dict[str, object]) -> CalendarEvent:
    event_id = _read_optional_int(arguments, "event_id")
    if event_id is not None:
        return _get_owned_event(db, user_id, event_id)

    event_name = _read_optional_string(arguments, "event_name")
    if event_name is None:
        raise ValueError("Provide 'event_name' for natural-language event operations.")

    exact_matches = (
        _get_owned_event_query(db, user_id)
        .filter(func.lower(CalendarEvent.name) == event_name.lower())
        .order_by(CalendarEvent.date.asc(), CalendarEvent.id.asc())
        .all()
    )
    if exact_matches:
        return _resolve_single_match(exact_matches, "event", event_name)

    partial_matches = (
        _get_owned_event_query(db, user_id)
        .filter(func.lower(CalendarEvent.name).like(f"%{event_name.lower()}%"))
        .order_by(CalendarEvent.date.asc(), CalendarEvent.id.asc())
        .all()
    )
    return _resolve_single_match(partial_matches, "event", event_name)


def _resolve_list_ids(db, user_id: int, list_names: list[str]) -> list[int]:
    list_ids: list[int] = []
    for list_name in list_names:
        exact_matches = (
            _get_accessible_list_query(db, user_id)
            .filter(func.lower(ShoppingList.name) == list_name.lower())
            .order_by(ShoppingList.id.desc())
            .all()
        )
        matches = exact_matches or (
            _get_accessible_list_query(db, user_id)
            .filter(func.lower(ShoppingList.name).like(f"%{list_name.lower()}%"))
            .order_by(ShoppingList.id.desc())
            .all()
        )
        shopping_list = _resolve_single_match(matches, "list", list_name)
        list_ids.append(shopping_list.id)
    return list_ids


def _serialize_event(calendar_event: CalendarEvent) -> dict[str, Any]:
    list_details = [
        {"id": link.list_id, "name": link.shopping_list.name if link.shopping_list is not None else None}
        for link in calendar_event.list_links
    ]
    return {
        "id": calendar_event.id,
        "name": calendar_event.name,
        "description": calendar_event.description,
        "icon": calendar_event.icon,
        "date": calendar_event.date.isoformat(),
        "list_ids": calendar_event.list_ids,
        "lists": list_details,
        "owner": _serialize_user_summary(calendar_event.owner),
        "collaborators": [_serialize_user_summary(user) for user in calendar_event.collaborators],
    }


def _serialize_user_summary(user: Any) -> dict[str, Any] | None:
    if user is None:
        return None
    return {
        "id": user.id,
        "username": user.username,
        "clerk_user_id": user.clerk_user_id,
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
    return stripped or None


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


def _read_optional_date(arguments: dict[str, object], key: str) -> dt_date | None:
    value = arguments.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(f"'{key}' must be an ISO date string.")
    stripped = value.strip()
    if not stripped:
        return None
    try:
        return dt_date.fromisoformat(stripped)
    except ValueError as exc:
        raise ValueError(f"'{key}' must be a valid ISO date in YYYY-MM-DD format.") from exc


def _read_required_date(arguments: dict[str, object], key: str) -> dt_date:
    value = _read_optional_date(arguments, key)
    if value is None:
        raise ValueError(f"'{key}' must be a valid ISO date in YYYY-MM-DD format.")
    return value


def _read_string_list(arguments: dict[str, object], key: str) -> list[str]:
    value = arguments.get(key)
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValueError(f"'{key}' must be an array of strings.")
    cleaned = [item.strip() for item in value if isinstance(item, str) and item.strip()]
    if len(cleaned) != len(value):
        raise ValueError(f"'{key}' must contain only non-empty strings.")
    return cleaned


def _read_required_string_list(arguments: dict[str, object], key: str) -> list[str]:
    values = _read_string_list(arguments, key)
    if not values:
        raise ValueError(f"'{key}' must contain at least one name.")
    return values


def _http_error_result(message: str, exc: HTTPException) -> ToolExecutionResult:
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return ToolExecutionResult(success=False, message=message, error=detail)


def _validation_error_result(message: str, exc: ValueError) -> ToolExecutionResult:
    return ToolExecutionResult(success=False, message=message, error=str(exc))
