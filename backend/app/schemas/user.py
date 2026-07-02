from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.core.username import normalize_username


class UserAllergyPayload(BaseModel):
    vegan: bool = False
    vegetarian: bool = False
    lactose_free: bool = False
    egg_free: bool = False
    gluten_free: bool = False
    nut_free: bool = False
    shellfish_free: bool = False
    soy_free: bool = False
    sesame_free: bool = False
    sulfite_free: bool = False


class UserUsernamePayload(BaseModel):
    username: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return normalize_username(value)


class UserResponse(UserAllergyPayload):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clerk_user_id: str
    username: str | None
    username_updated_at: datetime | None
    have_username: bool
