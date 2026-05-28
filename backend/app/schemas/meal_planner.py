from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


DayOfWeek = Literal[
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]


class MealPlanEntryCreate(BaseModel):
    recipe_id: int
    list_id: int | None = None
    day_of_week: DayOfWeek
    position: int = Field(ge=0)
    servings: int | None = Field(default=None, gt=0)


class MealPlanEntryUpdate(BaseModel):
    list_id: int | None = None
    day_of_week: DayOfWeek | None = None
    position: int | None = Field(default=None, ge=0)
    servings: int | None = Field(default=None, gt=0)


class MealPlanEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    recipe_id: int
    list_id: int | None
    day_of_week: DayOfWeek
    position: int
    servings: int | None
