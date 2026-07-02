from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_or_create_current_user
from app.core.time import utc_now_naive
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserAllergyPayload, UserResponse, UserUsernamePayload


router = APIRouter(prefix="/auth", tags=["auth"])
USERNAME_CHANGE_COOLDOWN_DAYS = 30


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_or_create_current_user)) -> User:
    return current_user


@router.put("/me/allergies", response_model=UserResponse)
def update_my_allergies(
    payload: UserAllergyPayload,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> User:
    for field, value in payload.model_dump().items():
        setattr(current_user, field, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/username", response_model=UserResponse)
def update_my_username(
    payload: UserUsernamePayload,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> User:
    now = utc_now_naive()

    if (
        current_user.have_username
        and current_user.username
        and current_user.username_updated_at is not None
    ):
        next_available_at = current_user.username_updated_at + timedelta(days=USERNAME_CHANGE_COOLDOWN_DAYS)
        if now < next_available_at:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Username can only be changed every 30 days. Try again after {next_available_at.isoformat()} UTC.",
            )

    existing_user = (
        db.query(User)
        .filter(func.lower(User.username) == payload.username.lower(), User.id != current_user.id)
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already in use",
        )

    current_user.username = payload.username
    current_user.have_username = True
    current_user.username_updated_at = now
    db.add(current_user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already in use",
        ) from None

    db.refresh(current_user)
    return current_user
