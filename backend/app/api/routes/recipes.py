from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, get_or_create_current_user
from app.models.favorite_recipe import FavoriteRecipe
from app.models.holiday import Holiday
from app.models.list_recipe import ListRecipe
from app.models.meal_plan_entry import MealPlanEntry
from app.models.recipe import Recipe
from app.models.recipe_holiday import RecipeHoliday
from app.models.recipe_rating import RecipeRating
from app.models.recipe_tag import RecipeTag
from app.models.saved_recipe import SavedRecipe
from app.models.shopping_list import ShoppingList
from app.models.tag import Tag, TagCategory
from app.models.user import User
from app.schemas.recipe import (
    FavoriteRecipeResponse,
    HolidayResponse,
    RecipeIngredient as RecipeIngredientSchema,
    RecipeRatingPayload,
    RecipeRatingSummaryResponse,
    RecipeResponse,
    SavedRecipePayload,
    SavedRecipeResponse,
    TagGroupsResponse,
    TagResponse,
    TimeFilter,
)


router = APIRouter(prefix="/recipes", tags=["recipes"])
tags_router = APIRouter(prefix="/tags", tags=["tags"])

DietaryFilterName = Literal[
    "vegan",
    "vegetarian",
    "lactose_free",
    "egg_free",
    "gluten_free",
    "nut_free",
    "shellfish_free",
    "soy_free",
    "sesame_free",
    "sulfite_free",
]

DIETARY_FILTER_FIELDS: tuple[DietaryFilterName, ...] = (
    "vegan",
    "vegetarian",
    "lactose_free",
    "egg_free",
    "gluten_free",
    "nut_free",
    "shellfish_free",
    "soy_free",
    "sesame_free",
    "sulfite_free",
)


def _normalize_slug_filters(values: list[str] | None) -> list[str]:
    if not values:
        return []

    return sorted({value.strip() for value in values if value.strip()})


def _get_recipe_or_404(db: Session, recipe_id: int) -> Recipe:
    recipe = (
        db.query(Recipe)
        .options(
            selectinload(Recipe.tag_links).selectinload(RecipeTag.tag),
            selectinload(Recipe.holiday_links).selectinload(RecipeHoliday.holiday),
            selectinload(Recipe.ingredients),
        )
        .filter(Recipe.id == recipe_id)
        .first()
    )
    if not recipe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")
    return recipe


def _apply_time_filter(query, time_filter: TimeFilter):
    if time_filter == "under_15m":
        return query.filter(Recipe.prep_time_minutes < 15)
    if time_filter == "under_30m":
        return query.filter(Recipe.prep_time_minutes < 30)
    if time_filter == "under_60m":
        return query.filter(Recipe.prep_time_minutes < 60)
    return query.filter(Recipe.prep_time_minutes >= 60)


def _build_recipe_query(db: Session, current_user: User):
    ratings_subquery = (
        db.query(
            RecipeRating.recipe_id.label("recipe_id"),
            func.avg(RecipeRating.rating).label("average_rating"),
            func.count(RecipeRating.user_id).label("ratings_count"),
        )
        .group_by(RecipeRating.recipe_id)
        .subquery()
    )

    user_ratings_subquery = (
        db.query(
            RecipeRating.recipe_id.label("recipe_id"),
            RecipeRating.rating.label("user_rating"),
        )
        .filter(RecipeRating.user_id == current_user.id)
        .subquery()
    )

    favorites_subquery = (
        db.query(FavoriteRecipe.recipe_id.label("recipe_id"))
        .filter(FavoriteRecipe.user_id == current_user.id)
        .subquery()
    )
    saved_recipes_subquery = (
        db.query(
            SavedRecipe.recipe_id.label("recipe_id"),
            SavedRecipe.servings.label("saved_servings"),
        )
        .filter(SavedRecipe.user_id == current_user.id)
        .subquery()
    )

    return (
        db.query(
            Recipe,
            ratings_subquery.c.average_rating,
            func.coalesce(ratings_subquery.c.ratings_count, 0).label("ratings_count"),
            user_ratings_subquery.c.user_rating,
            case((favorites_subquery.c.recipe_id.is_not(None), True), else_=False).label("is_favorite"),
            case((saved_recipes_subquery.c.recipe_id.is_not(None), True), else_=False).label("is_saved"),
            saved_recipes_subquery.c.saved_servings,
        )
        .options(
            selectinload(Recipe.tag_links).selectinload(RecipeTag.tag),
            selectinload(Recipe.holiday_links).selectinload(RecipeHoliday.holiday),
            selectinload(Recipe.ingredients),
        )
        .outerjoin(ratings_subquery, ratings_subquery.c.recipe_id == Recipe.id)
        .outerjoin(user_ratings_subquery, user_ratings_subquery.c.recipe_id == Recipe.id)
        .outerjoin(favorites_subquery, favorites_subquery.c.recipe_id == Recipe.id)
        .outerjoin(saved_recipes_subquery, saved_recipes_subquery.c.recipe_id == Recipe.id)
    )


def _serialize_recipe(
    recipe: Recipe,
    average_rating: float | None,
    ratings_count: int,
    user_rating: int | None,
    is_favorite: bool,
    is_saved: bool,
    saved_servings: int | None,
) -> RecipeResponse:
    return RecipeResponse(
        id=recipe.id,
        name=recipe.name,
        description=recipe.description,
        image=recipe.image,
        prep_time_minutes=recipe.prep_time_minutes,
        servings=recipe.servings,
        ingredients=[RecipeIngredientSchema.model_validate(ingredient) for ingredient in recipe.ingredients],
        instructions=recipe.instructions,
        vegan=recipe.vegan,
        vegetarian=recipe.vegetarian,
        lactose_free=recipe.lactose_free,
        egg_free=recipe.egg_free,
        gluten_free=recipe.gluten_free,
        nut_free=recipe.nut_free,
        shellfish_free=recipe.shellfish_free,
        soy_free=recipe.soy_free,
        sesame_free=recipe.sesame_free,
        sulfite_free=recipe.sulfite_free,
        tags=[TagResponse.model_validate(link.tag) for link in recipe.tag_links if link.tag is not None],
        holidays=[
            HolidayResponse.model_validate(link.holiday)
            for link in recipe.holiday_links
            if link.holiday is not None
        ],
        average_rating=float(average_rating) if average_rating is not None else None,
        ratings_count=ratings_count,
        user_rating=user_rating,
        is_favorite=is_favorite,
        is_saved=is_saved,
        saved_servings=saved_servings,
    )


def _get_rating_summary(db: Session, recipe_id: int, user_id: int) -> RecipeRatingSummaryResponse:
    average_rating, ratings_count = (
        db.query(
            func.avg(RecipeRating.rating),
            func.count(RecipeRating.user_id),
        )
        .filter(RecipeRating.recipe_id == recipe_id)
        .one()
    )
    user_rating = (
        db.query(RecipeRating.rating)
        .filter(RecipeRating.recipe_id == recipe_id, RecipeRating.user_id == user_id)
        .scalar()
    )
    return RecipeRatingSummaryResponse(
        recipe_id=recipe_id,
        average_rating=float(average_rating) if average_rating is not None else None,
        ratings_count=ratings_count,
        user_rating=user_rating,
    )


@router.get("", response_model=list[RecipeResponse])
def get_recipes(
    search: str | None = Query(default=None),
    tags: list[str] | None = Query(default=None),
    holidays: list[str] | None = Query(default=None),
    time_filter: TimeFilter | None = Query(default=None),
    vegan: bool | None = Query(default=None),
    vegetarian: bool | None = Query(default=None),
    lactose_free: bool | None = Query(default=None),
    egg_free: bool | None = Query(default=None),
    gluten_free: bool | None = Query(default=None),
    nut_free: bool | None = Query(default=None),
    shellfish_free: bool | None = Query(default=None),
    soy_free: bool | None = Query(default=None),
    sesame_free: bool | None = Query(default=None),
    sulfite_free: bool | None = Query(default=None),
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> list[RecipeResponse]:
    query = _build_recipe_query(db, current_user)

    if search:
        like_term = f"%{search.strip()}%"
        query = query.filter(or_(Recipe.name.ilike(like_term), Recipe.description.ilike(like_term)))

    if time_filter is not None:
        query = _apply_time_filter(query, time_filter)

    dietary_filters = {
        "vegan": vegan,
        "vegetarian": vegetarian,
        "lactose_free": lactose_free,
        "egg_free": egg_free,
        "gluten_free": gluten_free,
        "nut_free": nut_free,
        "shellfish_free": shellfish_free,
        "soy_free": soy_free,
        "sesame_free": sesame_free,
        "sulfite_free": sulfite_free,
    }
    for field_name in DIETARY_FILTER_FIELDS:
        value = dietary_filters[field_name]
        if value is not None:
            query = query.filter(getattr(Recipe, field_name) == value)

    normalized_tags = _normalize_slug_filters(tags)
    if normalized_tags:
        query = (
            query.join(RecipeTag, RecipeTag.recipe_id == Recipe.id)
            .join(Tag, Tag.id == RecipeTag.tag_id)
            .filter(Tag.slug.in_(normalized_tags))
            .distinct()
        )

    normalized_holidays = _normalize_slug_filters(holidays)
    if normalized_holidays:
        query = (
            query.join(RecipeHoliday, RecipeHoliday.recipe_id == Recipe.id)
            .join(Holiday, Holiday.id == RecipeHoliday.holiday_id)
            .filter(Holiday.slug.in_(normalized_holidays))
            .distinct()
        )

    rows = query.order_by(Recipe.name.asc()).all()
    return [
        _serialize_recipe(recipe, average_rating, ratings_count, user_rating, is_favorite, is_saved, saved_servings)
        for recipe, average_rating, ratings_count, user_rating, is_favorite, is_saved, saved_servings in rows
    ]


@router.get("/saved-recipes", response_model=list[RecipeResponse])
def get_saved_recipes(
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> list[RecipeResponse]:
    planned_recipe_ids = {
        recipe_id
        for (recipe_id,) in (
            db.query(MealPlanEntry.recipe_id)
            .filter(MealPlanEntry.user_id == current_user.id)
            .distinct()
            .all()
        )
    }
    existing_saved_recipe_ids = {
        recipe_id
        for (recipe_id,) in (
            db.query(SavedRecipe.recipe_id)
            .filter(SavedRecipe.user_id == current_user.id)
            .all()
        )
    }
    missing_saved_recipes = (
        db.query(ListRecipe.recipe_id, ListRecipe.servings)
        .join(ShoppingList, ShoppingList.id == ListRecipe.list_id)
        .filter(ShoppingList.user_id == current_user.id)
        .all()
    )
    should_commit = False
    for recipe_id, servings in missing_saved_recipes:
        if recipe_id in planned_recipe_ids:
            continue

        if recipe_id in existing_saved_recipe_ids:
            continue

        db.add(SavedRecipe(user_id=current_user.id, recipe_id=recipe_id, servings=servings))
        existing_saved_recipe_ids.add(recipe_id)
        should_commit = True

    if should_commit:
        db.commit()

    rows = (
        _build_recipe_query(db, current_user)
        .join(SavedRecipe, SavedRecipe.recipe_id == Recipe.id)
        .filter(SavedRecipe.user_id == current_user.id)
        .filter(~Recipe.id.in_(planned_recipe_ids) if planned_recipe_ids else True)
        .order_by(Recipe.name.asc())
        .all()
    )

    return [
        _serialize_recipe(recipe, average_rating, ratings_count, user_rating, is_favorite, is_saved, saved_servings)
        for recipe, average_rating, ratings_count, user_rating, is_favorite, is_saved, saved_servings in rows
    ]


@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe(
    recipe_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> RecipeResponse:
    row = _build_recipe_query(db, current_user).filter(Recipe.id == recipe_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

    recipe, average_rating, ratings_count, user_rating, is_favorite, is_saved, saved_servings = row
    return _serialize_recipe(recipe, average_rating, ratings_count, user_rating, is_favorite, is_saved, saved_servings)


@router.post("/{recipe_id}/favorite", response_model=FavoriteRecipeResponse, status_code=status.HTTP_201_CREATED)
def add_recipe_to_favorites(
    recipe_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> FavoriteRecipeResponse:
    _get_recipe_or_404(db, recipe_id)

    existing = (
        db.query(FavoriteRecipe)
        .filter(FavoriteRecipe.recipe_id == recipe_id, FavoriteRecipe.user_id == current_user.id)
        .first()
    )
    if not existing:
        db.add(FavoriteRecipe(user_id=current_user.id, recipe_id=recipe_id))
        db.commit()

    return FavoriteRecipeResponse(recipe_id=recipe_id, is_favorite=True)


@router.delete("/{recipe_id}/favorite", response_model=FavoriteRecipeResponse)
def remove_recipe_from_favorites(
    recipe_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> FavoriteRecipeResponse:
    _get_recipe_or_404(db, recipe_id)

    (
        db.query(FavoriteRecipe)
        .filter(FavoriteRecipe.recipe_id == recipe_id, FavoriteRecipe.user_id == current_user.id)
        .delete(synchronize_session=False)
    )
    db.commit()

    return FavoriteRecipeResponse(recipe_id=recipe_id, is_favorite=False)


@router.post("/{recipe_id}/save", response_model=SavedRecipeResponse, status_code=status.HTTP_201_CREATED)
def save_recipe(
    recipe_id: int,
    payload: SavedRecipePayload,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> SavedRecipeResponse:
    recipe = _get_recipe_or_404(db, recipe_id)
    resolved_servings = payload.servings if payload.servings is not None else recipe.servings

    saved_recipe = (
        db.query(SavedRecipe)
        .filter(SavedRecipe.recipe_id == recipe_id, SavedRecipe.user_id == current_user.id)
        .first()
    )
    if saved_recipe:
        saved_recipe.servings = resolved_servings
        db.add(saved_recipe)
    else:
        db.add(SavedRecipe(user_id=current_user.id, recipe_id=recipe_id, servings=resolved_servings))

    db.commit()
    return SavedRecipeResponse(recipe_id=recipe_id, servings=resolved_servings)


@router.delete("/{recipe_id}/save", response_model=SavedRecipeResponse)
def remove_saved_recipe(
    recipe_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> SavedRecipeResponse:
    _get_recipe_or_404(db, recipe_id)

    (
        db.query(SavedRecipe)
        .filter(SavedRecipe.recipe_id == recipe_id, SavedRecipe.user_id == current_user.id)
        .delete(synchronize_session=False)
    )
    db.commit()

    return SavedRecipeResponse(recipe_id=recipe_id, servings=None)


@router.post("/{recipe_id}/rating", response_model=RecipeRatingSummaryResponse)
def rate_recipe(
    recipe_id: int,
    payload: RecipeRatingPayload,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> RecipeRatingSummaryResponse:
    _get_recipe_or_404(db, recipe_id)

    rating = (
        db.query(RecipeRating)
        .filter(RecipeRating.recipe_id == recipe_id, RecipeRating.user_id == current_user.id)
        .first()
    )
    if rating:
        rating.rating = payload.rating
        db.add(rating)
    else:
        db.add(RecipeRating(user_id=current_user.id, recipe_id=recipe_id, rating=payload.rating))

    db.commit()
    return _get_rating_summary(db, recipe_id, current_user.id)


@router.delete("/{recipe_id}/rating", response_model=RecipeRatingSummaryResponse)
def delete_recipe_rating(
    recipe_id: int,
    current_user: User = Depends(get_or_create_current_user),
    db: Session = Depends(get_db),
) -> RecipeRatingSummaryResponse:
    _get_recipe_or_404(db, recipe_id)

    (
        db.query(RecipeRating)
        .filter(RecipeRating.recipe_id == recipe_id, RecipeRating.user_id == current_user.id)
        .delete(synchronize_session=False)
    )
    db.commit()

    return _get_rating_summary(db, recipe_id, current_user.id)


@tags_router.get("", response_model=TagGroupsResponse)
def get_tags(db: Session = Depends(get_db)) -> TagGroupsResponse:
    tags = db.query(Tag).order_by(Tag.category.asc(), Tag.name.asc()).all()
    holidays = db.query(Holiday).order_by(Holiday.name.asc()).all()
    grouped: dict[TagCategory, list[TagResponse]] = {category: [] for category in TagCategory}
    for tag in tags:
        grouped[tag.category].append(TagResponse.model_validate(tag))

    return TagGroupsResponse(
        meal_type=grouped[TagCategory.meal_type],
        cuisine=grouped[TagCategory.cuisine],
        occasion=grouped[TagCategory.occasion],
        weather=grouped[TagCategory.weather],
        difficulty=grouped[TagCategory.difficulty],
        cooking_method=grouped[TagCategory.cooking_method],
        main_protein=grouped[TagCategory.main_protein],
        holidays=[HolidayResponse.model_validate(holiday) for holiday in holidays],
    )
