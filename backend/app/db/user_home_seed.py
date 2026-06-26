from __future__ import annotations

from datetime import date as dt_date, timedelta

from sqlalchemy.orm import Session, selectinload

from app.models.calendar_event import CalendarEvent
from app.models.event_list import EventList
from app.models.list_item import ListItem
from app.models.list_recipe import ListRecipe
from app.models.recipe import Recipe
from app.models.shopping_list import ShoppingList
from app.models.user import User

SAMPLE_LISTS = (
    {
        "name": "Weeknight Dinner",
        "color": "green",
        "date_offset": 1,
        "icon": "dinner",
        "event_name": "Dinner with friends",
        "event_description": "Prep list for a quick dinner at home.",
    },
    {
        "name": "Weekend Brunch",
        "color": "amber",
        "date_offset": 3,
        "icon": "sparkles",
        "event_name": "Saturday brunch",
        "event_description": "Easy brunch setup for the weekend.",
    },
    {
        "name": "Birthday Dinner",
        "color": "rose",
        "date_offset": 7,
        "icon": "cake",
        "event_name": "Birthday dinner",
        "event_description": "Shared shopping plan for the celebration.",
    },
)


def _build_list_items(recipe: Recipe) -> list[ListItem]:
    items: list[ListItem] = []
    for ingredient in recipe.ingredients[:4]:
        items.append(
            ListItem(
                name=ingredient.name,
                quantity=ingredient.quantity,
                unit=ingredient.unit,
                checked=False,
            )
        )
    return items


def seed_home_content_for_user(db: Session, user: User) -> bool:
    if user.has_seeded_home_content:
        return False

    existing_lists = (
        db.query(ShoppingList)
        .filter(ShoppingList.user_id == user.id)
        .order_by(ShoppingList.id.asc())
        .all()
    )
    existing_events = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.user_id == user.id)
        .order_by(CalendarEvent.id.asc())
        .all()
    )

    recipes = (
        db.query(Recipe)
        .options(selectinload(Recipe.ingredients))
        .order_by(Recipe.id.asc())
        .limit(len(SAMPLE_LISTS))
        .all()
    )

    created_lists: list[ShoppingList] = []
    today = dt_date.today()
    changed = False

    if not existing_lists or not existing_events:
        for index, spec in enumerate(SAMPLE_LISTS):
            recipe = recipes[index] if index < len(recipes) else None
            shopping_list = ShoppingList(
                user_id=user.id,
                name=spec["name"],
                color=spec["color"],
                date=today + timedelta(days=spec["date_offset"]),
            )

            if recipe is not None:
                shopping_list.recipe_links.append(
                    ListRecipe(
                        recipe_id=recipe.id,
                        servings=recipe.servings,
                    )
                )
                shopping_list.items.extend(_build_list_items(recipe))

            db.add(shopping_list)
            created_lists.append(shopping_list)
        changed = True

    if created_lists:
        db.flush()

    if not existing_events:
        event_source_lists = created_lists[: len(SAMPLE_LISTS)] or existing_lists[: len(SAMPLE_LISTS)]
        for shopping_list, spec in zip(event_source_lists, SAMPLE_LISTS):
            calendar_event = CalendarEvent(
                user_id=user.id,
                name=spec["event_name"],
                description=spec["event_description"],
                icon=spec["icon"],
                date=shopping_list.date or today,
            )
            calendar_event.list_links.append(EventList(list_id=shopping_list.id))
            db.add(calendar_event)
        changed = True

    user.has_seeded_home_content = True
    db.add(user)
    return changed or True
