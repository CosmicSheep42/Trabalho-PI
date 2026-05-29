from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, get_or_create_current_user
from app.core.normalization import normalize_item_name
from app.models.list_item import ListItem
from app.models.list_recipe import ListRecipe
from app.models.recipe import Recipe
from app.models.saved_recipe import SavedRecipe
from app.models.shopping_list import ShoppingList
from app.models.user import User
from app.schemas.list import (
    BulkDeleteListItemsPayload,
    ListItemCreate,
    ListRecipeCreate,
    ListItemResponse,
    ListItemUpdate,
    ShoppingListCreate,
    ShoppingListResponse,
    ShoppingListUpdate,
)


router = APIRouter(prefix="/lists", tags=["lists"])


def _get_owned_list_query(db: Session, user_id: int):
    return (
        db.query(ShoppingList)
        .options(
            selectinload(ShoppingList.items),
            selectinload(ShoppingList.recipe_links),
        )
        .filter(ShoppingList.user_id == user_id)
    )


def _get_owned_list(db: Session, user_id: int, list_id: int) -> ShoppingList:
    shopping_list = _get_owned_list_query(db, user_id).filter(ShoppingList.id == list_id).first()
    if not shopping_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found")
    return shopping_list


def _get_owned_item(db: Session, user_id: int, item_id: int) -> ListItem:
    item = (
        db.query(ListItem)
        .join(ShoppingList, ListItem.list_id == ShoppingList.id)
        .filter(ListItem.id == item_id, ShoppingList.user_id == user_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List item not found")
    return item


def _get_recipe_with_ingredients_or_404(db: Session, recipe_id: int) -> Recipe:
    recipe = (
        db.query(Recipe)
        .options(selectinload(Recipe.ingredients))
        .filter(Recipe.id == recipe_id)
        .first()
    )
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return recipe


def _find_list_item_by_name_and_unit(
    shopping_list: ShoppingList,
    name: str,
    unit: str | None,
) -> ListItem | None:
    normalized_name = normalize_item_name(name)
    for item in shopping_list.items:
        if normalize_item_name(item.name) == normalized_name and item.unit == unit:
            return item
    return None


def _merge_recipe_ingredients_into_list(
    db: Session,
    shopping_list: ShoppingList,
    recipe: Recipe,
    servings: int | None,
) -> None:
    multiplier = _get_servings_multiplier(servings, recipe.servings)

    for ingredient in recipe.ingredients:
        existing_item = _find_list_item_by_name_and_unit(shopping_list, ingredient.name, ingredient.unit)
        scaled_quantity = _scale_ingredient_quantity(ingredient.quantity, multiplier)
        if existing_item is not None:
            if existing_item.quantity is not None and scaled_quantity is not None:
                existing_item.quantity += scaled_quantity
            db.add(existing_item)
            continue

        list_item = ListItem(
            list_id=shopping_list.id,
            name=ingredient.name,
            quantity=scaled_quantity,
            unit=ingredient.unit,
            checked=False,
        )
        shopping_list.items.append(list_item)
        db.add(list_item)


def _subtract_recipe_ingredients_from_list(
    db: Session,
    shopping_list: ShoppingList,
    recipe: Recipe,
    servings: int | None,
) -> None:
    multiplier = _get_servings_multiplier(servings, recipe.servings)

    for ingredient in recipe.ingredients:
        existing_item = _find_list_item_by_name_and_unit(shopping_list, ingredient.name, ingredient.unit)
        if existing_item is None:
            continue

        scaled_quantity = _scale_ingredient_quantity(ingredient.quantity, multiplier)

        if existing_item.quantity is None and scaled_quantity is None:
            shopping_list.items.remove(existing_item)
            db.delete(existing_item)
            continue

        if existing_item.quantity is None or scaled_quantity is None:
            continue

        updated_quantity = existing_item.quantity - scaled_quantity
        if updated_quantity <= 0:
            shopping_list.items.remove(existing_item)
            db.delete(existing_item)
            continue

        existing_item.quantity = updated_quantity
        db.add(existing_item)


def _resolve_list_recipe_servings(requested_servings: int | None, recipe_servings: int | None) -> int | None:
    if requested_servings is not None:
        return requested_servings

    if recipe_servings is not None and recipe_servings > 0:
        return recipe_servings

    return None


def _get_servings_multiplier(custom_servings: int | None, recipe_servings: int | None) -> float:
    if (
        custom_servings is None
        or custom_servings <= 0
        or recipe_servings is None
        or recipe_servings <= 0
    ):
        return 1.0

    return custom_servings / recipe_servings


def _scale_ingredient_quantity(quantity: float | None, multiplier: float) -> float | None:
    if quantity is None:
        return None

    return round(quantity * multiplier, 2)


def _upsert_saved_recipe(
    db: Session,
    user_id: int,
    recipe_id: int,
    servings: int | None,
) -> None:
    saved_recipe = (
        db.query(SavedRecipe)
        .filter(SavedRecipe.user_id == user_id, SavedRecipe.recipe_id == recipe_id)
        .first()
    )

    if saved_recipe is not None:
        saved_recipe.servings = servings
        db.add(saved_recipe)
        return

    db.add(SavedRecipe(user_id=user_id, recipe_id=recipe_id, servings=servings))


@router.get("", response_model=list[ShoppingListResponse])
def get_lists(
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> list[ShoppingList]:
    return _get_owned_list_query(db, current_user.id).order_by(ShoppingList.id.desc()).all()


@router.post("", response_model=ShoppingListResponse, status_code=status.HTTP_201_CREATED)
def create_list(
    payload: ShoppingListCreate,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> ShoppingList:
    shopping_list = ShoppingList(user_id=current_user.id, **payload.model_dump())
    db.add(shopping_list)
    db.commit()
    return _get_owned_list(db, current_user.id, shopping_list.id)


@router.patch("/{list_id}", response_model=ShoppingListResponse)
def update_list(
    list_id: int,
    payload: ShoppingListUpdate,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> ShoppingList:
    shopping_list = _get_owned_list(db, current_user.id, list_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(shopping_list, field, value)

    db.add(shopping_list)
    db.commit()
    return _get_owned_list(db, current_user.id, list_id)


@router.delete("/{list_id}")
def delete_list(
    list_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    shopping_list = _get_owned_list(db, current_user.id, list_id)
    db.delete(shopping_list)
    db.commit()
    return {"success": True}


@router.post("/{list_id}/items", response_model=ListItemResponse, status_code=status.HTTP_201_CREATED)
def create_list_item(
    list_id: int,
    payload: ListItemCreate,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> ListItem:
    _get_owned_list(db, current_user.id, list_id)

    item = ListItem(list_id=list_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/{list_id}/recipes/{recipe_id}", response_model=ShoppingListResponse)
def add_recipe_to_list(
    list_id: int,
    recipe_id: int,
    payload: ListRecipeCreate | None = Body(default=None),
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> ShoppingList:
    shopping_list = _get_owned_list(db, current_user.id, list_id)

    recipe = _get_recipe_with_ingredients_or_404(db, recipe_id)
    resolved_servings = _resolve_list_recipe_servings(
        payload.servings if payload is not None else None,
        recipe.servings,
    )

    existing_link = (
        db.query(ListRecipe)
        .filter(ListRecipe.list_id == list_id, ListRecipe.recipe_id == recipe_id)
        .first()
    )
    if existing_link:
        _upsert_saved_recipe(db, current_user.id, recipe_id, resolved_servings)
        if existing_link.servings != resolved_servings:
            _subtract_recipe_ingredients_from_list(db, shopping_list, recipe, existing_link.servings)
            existing_link.servings = resolved_servings
            _merge_recipe_ingredients_into_list(db, shopping_list, recipe, existing_link.servings)
            db.add(existing_link)
        db.commit()
        return _get_owned_list(db, current_user.id, shopping_list.id)

    db.add(ListRecipe(list_id=list_id, recipe_id=recipe_id, servings=resolved_servings))
    _merge_recipe_ingredients_into_list(db, shopping_list, recipe, resolved_servings)
    _upsert_saved_recipe(db, current_user.id, recipe_id, resolved_servings)
    db.commit()

    return _get_owned_list(db, current_user.id, shopping_list.id)


@router.delete("/{list_id}/recipes/{recipe_id}", response_model=ShoppingListResponse)
def remove_recipe_from_list(
    list_id: int,
    recipe_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> ShoppingList:
    shopping_list = _get_owned_list(db, current_user.id, list_id)
    recipe = _get_recipe_with_ingredients_or_404(db, recipe_id)

    link = (
        db.query(ListRecipe)
        .filter(ListRecipe.list_id == list_id, ListRecipe.recipe_id == recipe_id)
        .first()
    )
    if link:
        db.delete(link)
        _subtract_recipe_ingredients_from_list(db, shopping_list, recipe, link.servings)
        db.commit()

    return _get_owned_list(db, current_user.id, shopping_list.id)


@router.post("/{list_id}/items/bulk-delete")
def bulk_delete_list_items(
    list_id: int,
    payload: BulkDeleteListItemsPayload,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    _get_owned_list(db, current_user.id, list_id)

    if payload.item_ids:
        (
            db.query(ListItem)
            .filter(ListItem.list_id == list_id, ListItem.id.in_(payload.item_ids))
            .delete(synchronize_session=False)
        )
        db.commit()

    return {"success": True}


@router.patch("/items/{item_id}", response_model=ListItemResponse)
def update_list_item(
    item_id: int,
    payload: ListItemUpdate,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> ListItem:
    item = _get_owned_item(db, current_user.id, item_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}")
def delete_list_item(
    item_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    item = _get_owned_item(db, current_user.id, item_id)
    db.delete(item)
    db.commit()
    return {"success": True}
