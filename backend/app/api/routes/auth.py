from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_or_create_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserAllergyPayload, UserResponse


router = APIRouter(prefix="/auth", tags=["auth"])


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
