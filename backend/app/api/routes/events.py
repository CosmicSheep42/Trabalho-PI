from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, get_or_create_current_user
from app.models.calendar_event import CalendarEvent
from app.models.event_list import EventList
from app.models.shopping_list import ShoppingList
from app.models.user import User
from app.schemas.event import CalendarEventCreate, CalendarEventResponse, CalendarEventUpdate


router = APIRouter(prefix="/events", tags=["events"])


def _get_owned_event_query(db: Session, user_id: int):
    return (
        db.query(CalendarEvent)
        .options(selectinload(CalendarEvent.list_links))
        .filter(CalendarEvent.user_id == user_id)
    )


def _get_owned_event(db: Session, user_id: int, event_id: int) -> CalendarEvent:
    calendar_event = _get_owned_event_query(db, user_id).filter(CalendarEvent.id == event_id).first()
    if calendar_event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return calendar_event


def _get_owned_lists_by_ids(db: Session, user_id: int, list_ids: list[int]) -> list[ShoppingList]:
    owned_lists = (
        db.query(ShoppingList)
        .filter(ShoppingList.user_id == user_id, ShoppingList.id.in_(list_ids))
        .all()
    )

    if len(owned_lists) != len(set(list_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more lists do not belong to the current user",
        )

    return owned_lists


def _set_event_lists(db: Session, calendar_event: CalendarEvent, user_id: int, list_ids: list[int]) -> None:
    owned_lists = _get_owned_lists_by_ids(db, user_id, list_ids)
    calendar_event.list_links.clear()

    for shopping_list in owned_lists:
        calendar_event.list_links.append(EventList(list_id=shopping_list.id))

    db.add(calendar_event)


@router.get("", response_model=list[CalendarEventResponse])
def get_events(
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> list[CalendarEvent]:
    return _get_owned_event_query(db, current_user.id).order_by(CalendarEvent.date.asc(), CalendarEvent.id.asc()).all()


@router.post("", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: CalendarEventCreate,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> CalendarEvent:
    calendar_event = CalendarEvent(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        icon=payload.icon,
        date=payload.date,
    )
    _set_event_lists(db, calendar_event, current_user.id, payload.list_ids)
    db.commit()
    return _get_owned_event(db, current_user.id, calendar_event.id)


@router.patch("/{event_id}", response_model=CalendarEventResponse)
def update_event(
    event_id: int,
    payload: CalendarEventUpdate,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> CalendarEvent:
    calendar_event = _get_owned_event(db, current_user.id, event_id)
    payload_data = payload.model_dump(exclude_unset=True)
    list_ids = payload_data.pop("list_ids", None)

    for field, value in payload_data.items():
        setattr(calendar_event, field, value)

    if list_ids is not None:
        _set_event_lists(db, calendar_event, current_user.id, list_ids)

    db.add(calendar_event)
    db.commit()
    return _get_owned_event(db, current_user.id, event_id)


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    calendar_event = _get_owned_event(db, current_user.id, event_id)
    db.delete(calendar_event)
    db.commit()
    return {"success": True}
