from __future__ import annotations

from datetime import date as dt_date

from pydantic import BaseModel, ConfigDict, Field


class CalendarEventBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=4000)
    icon: str = Field(min_length=1, max_length=64)
    date: dt_date
    list_ids: list[int] = Field(default_factory=list)


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    icon: str | None = Field(default=None, min_length=1, max_length=64)
    date: dt_date | None = None
    list_ids: list[int] | None = None


class CalendarEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    icon: str
    date: dt_date
    list_ids: list[int]
