from __future__ import annotations

from datetime import date as dt_date
from pydantic import BaseModel, ConfigDict, Field


class ListItemBase(BaseModel):
    name: str
    quantity: float | None = None
    unit: str | None = None
    checked: bool = False


class ListItemCreate(ListItemBase):
    pass


class ListItemUpdate(BaseModel):
    name: str | None = None
    quantity: float | None = None
    unit: str | None = None
    checked: bool | None = None


class ListItemResponse(ListItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    list_id: int


class ShoppingListBase(BaseModel):
    name: str
    color: str
    date: dt_date | None = None


class ShoppingListCreate(ShoppingListBase):
    pass


class ShoppingListUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    date: dt_date | None = None


class ListRecipeCreate(BaseModel):
    servings: int | None = Field(default=None, gt=0)


class ListRecipeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    recipe_id: int
    servings: int | None


class ShoppingListResponse(ShoppingListBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    items: list[ListItemResponse]
    recipe_ids: list[int]
    list_recipes: list[ListRecipeResponse]


class BulkDeleteListItemsPayload(BaseModel):
    item_ids: list[int]
