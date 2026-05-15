from pydantic import BaseModel, ConfigDict


class UserAllergyPayload(BaseModel):
    vegan: bool = False
    vegetarian: bool = False
    lactose_free: bool = False
    gluten_free: bool = False
    no_eggs: bool = False
    nut_free: bool = False
    low_carb: bool = False
    high_protein: bool = False


class UserResponse(UserAllergyPayload):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clerk_user_id: str
