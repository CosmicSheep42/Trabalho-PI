from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, get_or_create_current_user
from app.models.list_item import ListItem
from app.models.list_recipe import ListRecipe
from app.models.recipe import Recipe
from app.models.shopping_list import ShoppingList
from app.models.user import User
from app.schemas.list import (
    BulkDeleteListItemsPayload,
    ListItemCreate,
    ListItemResponse,
    ListItemUpdate,
    ShoppingListCreate,
    ShoppingListResponse,
    ShoppingListUpdate,
)


router = APIRouter(prefix="/lists", tags=["lists"])


def _get_owned_list(db: Session, user_id: int, list_id: int) -> ShoppingList:
    shopping_list = (
        db.query(ShoppingList)
        .options(selectinload(ShoppingList.items), selectinload(ShoppingList.recipe_links))
        .filter(ShoppingList.id == list_id, ShoppingList.user_id == user_id)
        .first()
    )
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


@router.get("", response_model=list[ShoppingListResponse])
def get_lists(
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> list[ShoppingList]:
    return (
        db.query(ShoppingList)
        .options(selectinload(ShoppingList.items), selectinload(ShoppingList.recipe_links))
        .filter(ShoppingList.user_id == current_user.id)
        .order_by(ShoppingList.id.desc())
        .all()
    )


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
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> ShoppingList:
    shopping_list = _get_owned_list(db, current_user.id, list_id)

    recipe = db.query(Recipe.id).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    existing_link = (
        db.query(ListRecipe)
        .filter(ListRecipe.list_id == list_id, ListRecipe.recipe_id == recipe_id)
        .first()
    )
    if not existing_link:
        db.add(ListRecipe(list_id=list_id, recipe_id=recipe_id))
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

    (
        db.query(ListRecipe)
        .filter(ListRecipe.list_id == list_id, ListRecipe.recipe_id == recipe_id)
        .delete(synchronize_session=False)
    )
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
