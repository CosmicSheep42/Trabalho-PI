from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
from clerk_backend_api import AuthenticateRequestOptions, authenticate_request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User


def _extract_clerk_user_id(payload: object) -> str | None:
    if payload is None:
        return None

    if isinstance(payload, dict):
        return payload.get("sub")

    return getattr(payload, "sub", None)


def get_current_clerk_user_id(request: Request) -> str:
    request_state = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=settings.clerk_secret_key,
            jwt_key=settings.clerk_jwt_key or None,
            authorized_parties=[settings.frontend_url],
            accepts_token=["session_token"],
        ),
    )

    if not request_state.is_signed_in:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unauthorized: {request_state.reason}",
        )

    clerk_user_id = _extract_clerk_user_id(request_state.payload)
    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to resolve Clerk user id from token",
        )

    return clerk_user_id


def get_or_create_current_user(
    clerk_user_id: str = Depends(get_current_clerk_user_id),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if user:
        return user

    user = User(clerk_user_id=clerk_user_id)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
