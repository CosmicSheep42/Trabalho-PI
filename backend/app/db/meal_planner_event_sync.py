from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date as dt_date, timedelta

from sqlalchemy.orm import Session, selectinload

from app.models.calendar_event import CalendarEvent
from app.models.event_list import EventList
from app.models.meal_plan_entry import MealPlanEntry
from app.models.shopping_list import ShoppingList
from app.models.user import User


@dataclass(frozen=True)
class PlannedEventRecipe:
    event_id: int
    recipe_id: int
    list_id: int | None
    day_of_week: str
    servings: int | None
    scheduled_date: dt_date


def _start_of_week(today: dt_date) -> dt_date:
    return today - timedelta(days=today.weekday())


def sync_event_meal_planner_entries(db: Session, user: User) -> bool:
    today = dt_date.today()
    week_start = _start_of_week(today)
    week_end = week_start + timedelta(days=6)

    weekly_events = (
        db.query(CalendarEvent)
        .options(
            selectinload(CalendarEvent.list_links)
            .selectinload(EventList.shopping_list)
            .selectinload(ShoppingList.recipe_links)
        )
        .filter(
            CalendarEvent.user_id == user.id,
            CalendarEvent.date >= week_start,
            CalendarEvent.date <= week_end,
        )
        .order_by(CalendarEvent.date.asc(), CalendarEvent.id.asc())
        .all()
    )

    desired_entries: list[PlannedEventRecipe] = []
    for event in weekly_events:
        for event_list in event.list_links:
            shopping_list = event_list.shopping_list
            if shopping_list is None:
                continue

            for recipe_link in shopping_list.recipe_links:
                desired_entries.append(
                    PlannedEventRecipe(
                        event_id=event.id,
                        recipe_id=recipe_link.recipe_id,
                        list_id=shopping_list.id,
                        day_of_week=event.date.strftime("%A"),
                        servings=recipe_link.servings,
                        scheduled_date=event.date,
                    )
                )

    manual_counts_by_day: dict[str, int] = defaultdict(int)
    manual_entries = (
        db.query(MealPlanEntry)
        .filter(MealPlanEntry.user_id == user.id, MealPlanEntry.source != "event")
        .all()
    )
    for entry in manual_entries:
        manual_counts_by_day[entry.day_of_week] += 1

    desired_with_position: list[tuple[PlannedEventRecipe, int]] = []
    generated_counts_by_day: dict[str, int] = defaultdict(int)
    for planned in desired_entries:
        position = manual_counts_by_day[planned.day_of_week] + generated_counts_by_day[planned.day_of_week]
        desired_with_position.append((planned, position))
        generated_counts_by_day[planned.day_of_week] += 1

    existing_generated = (
        db.query(MealPlanEntry)
        .filter(MealPlanEntry.user_id == user.id, MealPlanEntry.source == "event")
        .all()
    )
    existing_by_key = {
        (entry.event_id, entry.recipe_id, entry.list_id): entry
        for entry in existing_generated
    }
    desired_keys = {
        (planned.event_id, planned.recipe_id, planned.list_id)
        for planned, _position in desired_with_position
    }

    changed = False

    for entry in existing_generated:
        key = (entry.event_id, entry.recipe_id, entry.list_id)
        if key not in desired_keys:
            db.delete(entry)
            changed = True

    for planned, position in desired_with_position:
        key = (planned.event_id, planned.recipe_id, planned.list_id)
        existing_entry = existing_by_key.get(key)
        if existing_entry is None:
            db.add(
                MealPlanEntry(
                    user_id=user.id,
                    recipe_id=planned.recipe_id,
                    list_id=planned.list_id,
                    day_of_week=planned.day_of_week,
                    position=position,
                    servings=planned.servings,
                    source="event",
                    event_id=planned.event_id,
                    scheduled_date=planned.scheduled_date,
                )
            )
            changed = True
            continue

        if (
            existing_entry.day_of_week != planned.day_of_week
            or existing_entry.position != position
            or existing_entry.servings != planned.servings
            or existing_entry.scheduled_date != planned.scheduled_date
        ):
            existing_entry.day_of_week = planned.day_of_week
            existing_entry.position = position
            existing_entry.servings = planned.servings
            existing_entry.scheduled_date = planned.scheduled_date
            db.add(existing_entry)
            changed = True

    return changed
