from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import case
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_or_create_current_user
from app.db.meal_planner_event_sync import sync_event_meal_planner_entries
from app.models.meal_plan_entry import MealPlanEntry
from app.models.recipe import Recipe
from app.models.shopping_list import ShoppingList
from app.models.user import User
from app.schemas.meal_planner import (
    MealPlanEntryCreate,
    MealPlanEntryResponse,
    MealPlanEntryUpdate,
)


router = APIRouter(prefix="/meal-planner", tags=["meal-planner"])

DAY_ORDER = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6,
}


def _get_day_order_case():
    return case(DAY_ORDER, value=MealPlanEntry.day_of_week, else_=99)


def _get_recipe_or_404(db: Session, recipe_id: int) -> Recipe:
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return recipe


def _validate_owned_list(db: Session, user_id: int, list_id: int | None) -> ShoppingList | None:
    if list_id is None:
        return None

    shopping_list = (
        db.query(ShoppingList)
        .filter(ShoppingList.id == list_id, ShoppingList.user_id == user_id)
        .first()
    )
    if not shopping_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    return shopping_list


def _get_owned_entry(db: Session, user_id: int, entry_id: int) -> MealPlanEntry:
    entry = (
        db.query(MealPlanEntry)
        .filter(MealPlanEntry.id == entry_id, MealPlanEntry.user_id == user_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal planner entry not found")
    return entry


@router.get("", response_model=list[MealPlanEntryResponse])
def get_meal_planner_entries(
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> list[MealPlanEntry]:
    if sync_event_meal_planner_entries(db, current_user):
        db.commit()

    return (
        db.query(MealPlanEntry)
        .filter(MealPlanEntry.user_id == current_user.id)
        .order_by(_get_day_order_case(), MealPlanEntry.position.asc(), MealPlanEntry.id.asc())
        .all()
    )


@router.post("", response_model=MealPlanEntryResponse, status_code=status.HTTP_201_CREATED)
def create_meal_planner_entry(
    payload: MealPlanEntryCreate,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> MealPlanEntry:
    _get_recipe_or_404(db, payload.recipe_id)
    _validate_owned_list(db, current_user.id, payload.list_id)

    entry = MealPlanEntry(user_id=current_user.id, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/{entry_id}", response_model=MealPlanEntryResponse)
def update_meal_planner_entry(
    entry_id: int,
    payload: MealPlanEntryUpdate,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> MealPlanEntry:
    entry = _get_owned_entry(db, current_user.id, entry_id)

    changes = payload.model_dump(exclude_unset=True)
    if "list_id" in changes:
        _validate_owned_list(db, current_user.id, changes["list_id"])

    for field, value in changes.items():
        setattr(entry, field, value)

    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
def delete_meal_planner_entry(
    entry_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    entry = _get_owned_entry(db, current_user.id, entry_id)
    db.delete(entry)
    db.commit()
    return {"success": True}
