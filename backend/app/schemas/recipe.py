from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


TagCategory = Literal["meal_type", "cuisine", "occasion"]
TimeFilter = Literal["under_15m", "under_30m", "under_60m", "above_60m"]


class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    category: TagCategory


class RecipeIngredient(BaseModel):
    name: str
    amount: str


class RecipeRatingPayload(BaseModel):
    rating: int = Field(ge=1, le=5)


class RecipeResponse(BaseModel):
    id: int
    name: str
    description: str
    image: str
    prep_time_minutes: int
    servings: int | None
    ingredients: list[RecipeIngredient]
    instructions: list[str]
    vegan: bool
    vegetarian: bool
    lactose_free: bool
    egg_free: bool
    gluten_free: bool
    nut_free: bool
    shellfish_free: bool
    soy_free: bool
    sesame_free: bool
    sulfite_free: bool
    tags: list[TagResponse]
    average_rating: float | None
    ratings_count: int
    user_rating: int | None
    is_favorite: bool


class RecipeRatingSummaryResponse(BaseModel):
    success: bool = True
    recipe_id: int
    average_rating: float | None
    ratings_count: int
    user_rating: int | None


class FavoriteRecipeResponse(BaseModel):
    success: bool = True
    recipe_id: int
    is_favorite: bool


class TagGroupsResponse(BaseModel):
    meal_type: list[TagResponse]
    cuisine: list[TagResponse]
    occasion: list[TagResponse]
