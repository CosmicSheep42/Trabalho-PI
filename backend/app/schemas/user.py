from pydantic import BaseModel, ConfigDict


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


class UserResponse(UserAllergyPayload):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clerk_user_id: str
