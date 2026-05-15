from __future__ import annotations

from datetime import date as dt_date

from pydantic import BaseModel, ConfigDict


class ListItemBase(BaseModel):
    text: str
    amount: str = ""
    checked: bool = False


class ListItemCreate(ListItemBase):
    pass


class ListItemUpdate(BaseModel):
    text: str | None = None
    amount: str | None = None
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


class ShoppingListResponse(ShoppingListBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    items: list[ListItemResponse]


class BulkDeleteListItemsPayload(BaseModel):
    item_ids: list[int]
