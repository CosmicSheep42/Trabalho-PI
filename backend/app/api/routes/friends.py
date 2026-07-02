from __future__ import annotations

from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.api.deps import get_or_create_current_user
from app.core.time import utc_now_naive
from app.db.session import get_db
from app.models.friendship import Friendship
from app.models.friendship_request import FriendshipRequest
from app.models.user import User
from app.schemas.friend import (
    FriendSearchResult,
    FriendsOverviewResponse,
    FriendshipRequestPayload,
    FriendshipRequestSummary,
    FriendUserSummary,
)


router = APIRouter(prefix="/friends", tags=["friends"])
FRIENDSHIP_REQUEST_PENDING = "pending"
FRIENDSHIP_REQUEST_ACCEPTED = "accepted"
FRIENDSHIP_REQUEST_DECLINED = "declined"
FRIENDSHIP_REQUEST_CANCELLED = "cancelled"


def _pair_ids(left_user_id: int, right_user_id: int) -> tuple[int, int]:
    return (left_user_id, right_user_id) if left_user_id < right_user_id else (right_user_id, left_user_id)


def _find_friendship(db: Session, left_user_id: int, right_user_id: int) -> Friendship | None:
    user_one_id, user_two_id = _pair_ids(left_user_id, right_user_id)
    return (
        db.query(Friendship)
        .filter(Friendship.user_one_id == user_one_id, Friendship.user_two_id == user_two_id)
        .first()
    )


def _find_friendship_request(db: Session, left_user_id: int, right_user_id: int) -> FriendshipRequest | None:
    user_one_id, user_two_id = _pair_ids(left_user_id, right_user_id)
    return (
        db.query(FriendshipRequest)
        .filter(FriendshipRequest.user_one_id == user_one_id, FriendshipRequest.user_two_id == user_two_id)
        .first()
    )


def _build_user_summary(user: User) -> FriendUserSummary:
    return FriendUserSummary(id=user.id, username=user.username or "")


def _build_request_summary(request: FriendshipRequest, other_user: User) -> FriendshipRequestSummary:
    return FriendshipRequestSummary(
        id=request.id,
        status=request.status,
        created_at=request.created_at,
        user=_build_user_summary(other_user),
    )


@router.get("", response_model=FriendsOverviewResponse)
def get_friends_overview(
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> FriendsOverviewResponse:
    friendship_rows = (
        db.query(Friendship)
        .filter(or_(Friendship.user_one_id == current_user.id, Friendship.user_two_id == current_user.id))
        .order_by(Friendship.created_at.asc(), Friendship.id.asc())
        .all()
    )
    friend_ids = [
        friendship.user_two_id if friendship.user_one_id == current_user.id else friendship.user_one_id
        for friendship in friendship_rows
    ]
    friends_by_id = {}
    if friend_ids:
        friends_by_id = {
            user.id: user
            for user in db.query(User)
            .filter(User.id.in_(friend_ids))
            .order_by(func.lower(User.username).asc(), User.id.asc())
            .all()
        }

    incoming_rows = (
        db.query(FriendshipRequest)
        .filter(
            FriendshipRequest.addressee_id == current_user.id,
            FriendshipRequest.status == FRIENDSHIP_REQUEST_PENDING,
        )
        .order_by(FriendshipRequest.created_at.asc(), FriendshipRequest.id.asc())
        .all()
    )
    outgoing_rows = (
        db.query(FriendshipRequest)
        .filter(
            FriendshipRequest.requester_id == current_user.id,
            FriendshipRequest.status == FRIENDSHIP_REQUEST_PENDING,
        )
        .order_by(FriendshipRequest.created_at.asc(), FriendshipRequest.id.asc())
        .all()
    )

    request_user_ids = {request.requester_id for request in incoming_rows} | {request.addressee_id for request in outgoing_rows}
    request_users_by_id = {}
    if request_user_ids:
        request_users_by_id = {
            user.id: user
            for user in db.query(User).filter(User.id.in_(request_user_ids)).all()
        }

    friends = [
        _build_user_summary(friend)
        for friend in sorted(
            friends_by_id.values(),
            key=lambda user: ((user.username or "").lower(), user.id),
        )
    ]
    incoming_requests = [
        _build_request_summary(request, request_users_by_id[request.requester_id])
        for request in incoming_rows
        if request.requester_id in request_users_by_id
    ]
    outgoing_requests = [
        _build_request_summary(request, request_users_by_id[request.addressee_id])
        for request in outgoing_rows
        if request.addressee_id in request_users_by_id
    ]

    return FriendsOverviewResponse(
        friends=friends,
        incoming_requests=incoming_requests,
        outgoing_requests=outgoing_requests,
    )


@router.get("/search", response_model=list[FriendSearchResult])
def search_users_by_username(
    query: str = Query(min_length=1, max_length=50),
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> list[FriendSearchResult]:
    normalized_query = query.strip()
    if not normalized_query:
        return []

    users = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            User.username.isnot(None),
            User.have_username.is_(True),
            User.username.ilike(f"%{normalized_query}%"),
        )
        .order_by(func.lower(User.username).asc(), User.id.asc())
        .limit(20)
        .all()
    )

    results: list[FriendSearchResult] = []
    for user in users:
      relation_status = "none"
      if _find_friendship(db, current_user.id, user.id):
          relation_status = "friends"
      else:
          request = _find_friendship_request(db, current_user.id, user.id)
          if request and request.status == FRIENDSHIP_REQUEST_PENDING:
              relation_status = (
                  "outgoing_request" if request.requester_id == current_user.id else "incoming_request"
              )

      results.append(
          FriendSearchResult(
              user=_build_user_summary(user),
              relation_status=relation_status,
          )
      )

    return results


@router.post("/requests", response_model=FriendshipRequestSummary, status_code=status.HTTP_201_CREATED)
def send_friendship_request(
    payload: FriendshipRequestPayload,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> FriendshipRequestSummary:
    username = payload.username.strip()
    target_user = (
        db.query(User)
        .filter(
            func.lower(User.username) == username.lower(),
            User.have_username.is_(True),
        )
        .first()
    )
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot add yourself")
    if _find_friendship(db, current_user.id, target_user.id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You are already connected")

    now = utc_now_naive()
    request = _find_friendship_request(db, current_user.id, target_user.id)
    if request:
        if request.status == FRIENDSHIP_REQUEST_PENDING:
            if request.requester_id == current_user.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request already sent")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This user has already sent you a request",
            )
        request.requester_id = current_user.id
        request.addressee_id = target_user.id
        request.status = FRIENDSHIP_REQUEST_PENDING
        request.created_at = now
        request.updated_at = now
        request.responded_at = None
    else:
        user_one_id, user_two_id = _pair_ids(current_user.id, target_user.id)
        request = FriendshipRequest(
            requester_id=current_user.id,
            addressee_id=target_user.id,
            user_one_id=user_one_id,
            user_two_id=user_two_id,
            status=FRIENDSHIP_REQUEST_PENDING,
            created_at=now,
            updated_at=now,
            responded_at=None,
        )
        db.add(request)

    db.commit()
    db.refresh(request)
    return _build_request_summary(request, target_user)


@router.post("/requests/{request_id}/accept", response_model=FriendUserSummary)
def accept_friendship_request(
    request_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> FriendUserSummary:
    request = (
        db.query(FriendshipRequest)
        .filter(
            FriendshipRequest.id == request_id,
            FriendshipRequest.addressee_id == current_user.id,
            FriendshipRequest.status == FRIENDSHIP_REQUEST_PENDING,
        )
        .first()
    )
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    requester = db.query(User).filter(User.id == request.requester_id).first()
    if not requester:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not _find_friendship(db, current_user.id, requester.id):
        user_one_id, user_two_id = _pair_ids(current_user.id, requester.id)
        db.add(
            Friendship(
                user_one_id=user_one_id,
                user_two_id=user_two_id,
                created_at=utc_now_naive(),
            )
        )

    request.status = FRIENDSHIP_REQUEST_ACCEPTED
    request.updated_at = utc_now_naive()
    request.responded_at = request.updated_at
    db.add(request)
    db.commit()
    return _build_user_summary(requester)


@router.post(
    "/requests/{request_id}/decline",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def decline_friendship_request(
    request_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> Response:
    request = (
        db.query(FriendshipRequest)
        .filter(
            FriendshipRequest.id == request_id,
            FriendshipRequest.addressee_id == current_user.id,
            FriendshipRequest.status == FRIENDSHIP_REQUEST_PENDING,
        )
        .first()
    )
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    request.status = FRIENDSHIP_REQUEST_DECLINED
    request.updated_at = utc_now_naive()
    request.responded_at = request.updated_at
    db.add(request)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/requests/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def cancel_friendship_request(
    request_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> Response:
    request = (
        db.query(FriendshipRequest)
        .filter(
            FriendshipRequest.id == request_id,
            FriendshipRequest.requester_id == current_user.id,
            FriendshipRequest.status == FRIENDSHIP_REQUEST_PENDING,
        )
        .first()
    )
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    request.status = FRIENDSHIP_REQUEST_CANCELLED
    request.updated_at = utc_now_naive()
    request.responded_at = request.updated_at
    db.add(request)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/{friend_user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def remove_friendship(
    friend_user_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> Response:
    friendship = _find_friendship(db, current_user.id, friend_user_id)
    if not friendship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friendship not found")

    db.delete(friendship)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
