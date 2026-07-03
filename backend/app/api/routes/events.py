from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, get_or_create_current_user
from app.models.calendar_event import CalendarEvent
from app.models.event_list import EventList
from app.models.event_member import EventMember
from app.models.friend_group import FriendGroup
from app.models.friendship import Friendship
from app.models.list_member import ListMember
from app.models.shopping_list import ShoppingList
from app.models.user import User
from app.core.time import utc_now_naive
from app.schemas.event import CalendarEventCreate, CalendarEventResponse, CalendarEventUpdate, ShareEventPayload


router = APIRouter(prefix="/events", tags=["events"])


def _get_owned_event_query(db: Session, user_id: int):
    return (
        db.query(CalendarEvent)
        .options(
            selectinload(CalendarEvent.user),
            selectinload(CalendarEvent.list_links),
            selectinload(CalendarEvent.shared_memberships).selectinload(EventMember.user),
        )
        .filter(
            or_(
                CalendarEvent.user_id == user_id,
                CalendarEvent.shared_memberships.any(EventMember.user_id == user_id),
            )
        )
    )


def _get_owned_event(db: Session, user_id: int, event_id: int) -> CalendarEvent:
    calendar_event = _get_owned_event_query(db, user_id).filter(CalendarEvent.id == event_id).first()
    if calendar_event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return calendar_event


def _pair_ids(left_user_id: int, right_user_id: int) -> tuple[int, int]:
    return (left_user_id, right_user_id) if left_user_id < right_user_id else (right_user_id, left_user_id)


def _are_friends(db: Session, left_user_id: int, right_user_id: int) -> bool:
    user_one_id, user_two_id = _pair_ids(left_user_id, right_user_id)
    friendship = (
        db.query(Friendship)
        .filter(Friendship.user_one_id == user_one_id, Friendship.user_two_id == user_two_id)
        .first()
    )
    return friendship is not None


def _get_accessible_lists_by_ids(db: Session, user_id: int, list_ids: list[int]) -> list[ShoppingList]:
    accessible_lists = (
        db.query(ShoppingList)
        .filter(
            ShoppingList.id.in_(list_ids),
            or_(
                ShoppingList.user_id == user_id,
                ShoppingList.shared_memberships.any(ListMember.user_id == user_id),
            ),
        )
        .all()
    )

    if len(accessible_lists) != len(set(list_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more lists are not accessible to the current user",
        )

    return accessible_lists


def _set_event_lists(db: Session, calendar_event: CalendarEvent, user_id: int, list_ids: list[int]) -> None:
    accessible_lists = _get_accessible_lists_by_ids(db, user_id, list_ids)
    calendar_event.list_links.clear()

    for shopping_list in accessible_lists:
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


@router.post("/{event_id}/share", response_model=CalendarEventResponse)
def share_event_with_friend(
    event_id: int,
    payload: ShareEventPayload,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> CalendarEvent:
    calendar_event = _get_owned_event(db, current_user.id, event_id)

    group_ids = sorted(set(payload.group_ids))
    grouped_friend_ids: set[int] = set()
    if group_ids:
        groups = (
            db.query(FriendGroup)
            .options(selectinload(FriendGroup.members))
            .filter(FriendGroup.user_id == current_user.id, FriendGroup.id.in_(group_ids))
            .all()
        )
        if len(groups) != len(group_ids):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more groups were not found")
        for group in groups:
            grouped_friend_ids.update(member.friend_user_id for member in group.members)

    explicit_friend_ids = set(payload.friend_user_ids)
    if payload.friend_user_id is not None:
        explicit_friend_ids.add(payload.friend_user_id)

    candidate_friend_ids = sorted(explicit_friend_ids | grouped_friend_ids)
    if not candidate_friend_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select at least one friend or group")

    existing_member_ids = {calendar_event.user_id} | {
        membership.user_id for membership in calendar_event.shared_memberships
    }
    friend_users = {
        user.id: user
        for user in db.query(User).filter(User.id.in_(candidate_friend_ids)).all()
    }
    if len(friend_users) != len(candidate_friend_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more friends were not found")

    ids_to_add: list[int] = []
    for friend_user_id in candidate_friend_ids:
        if friend_user_id == current_user.id:
            continue
        if friend_user_id in existing_member_ids:
            continue
        friend_user = friend_users[friend_user_id]
        if not _are_friends(db, current_user.id, friend_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only share events with friends")
        ids_to_add.append(friend_user_id)

    if not ids_to_add:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="All selected friends already have access to the event")

    now = utc_now_naive()
    for friend_user_id in ids_to_add:
        db.add(
            EventMember(
                event_id=calendar_event.id,
                user_id=friend_user_id,
                invited_by_user_id=current_user.id,
                created_at=now,
            )
        )
    db.commit()
    return _get_owned_event(db, current_user.id, calendar_event.id)


@router.delete("/{event_id}/members/{member_user_id}", response_model=CalendarEventResponse)
def remove_event_member(
    event_id: int,
    member_user_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> CalendarEvent:
    calendar_event = _get_owned_event(db, current_user.id, event_id)

    if calendar_event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the event owner can remove collaborators")

    if member_user_id == calendar_event.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The event owner cannot be removed")

    membership = (
        db.query(EventMember)
        .filter(EventMember.event_id == calendar_event.id, EventMember.user_id == member_user_id)
        .first()
    )
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collaborator not found")

    db.delete(membership)
    db.commit()
    return _get_owned_event(db, current_user.id, event_id)
