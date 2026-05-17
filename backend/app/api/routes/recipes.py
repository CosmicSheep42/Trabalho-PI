from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, get_or_create_current_user
from app.models.favorite_recipe import FavoriteRecipe
from app.models.recipe import Recipe
from app.models.recipe_rating import RecipeRating
from app.models.recipe_tag import RecipeTag
from app.models.tag import Tag, TagCategory
from app.models.user import User
from app.schemas.recipe import (
    FavoriteRecipeResponse,
    RecipeRatingPayload,
    RecipeRatingSummaryResponse,
    RecipeResponse,
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


def _get_recipe_or_404(db: Session, recipe_id: int) -> Recipe:
    recipe = (
        db.query(Recipe)
        .options(selectinload(Recipe.tag_links).selectinload(RecipeTag.tag))
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

    return (
        db.query(
            Recipe,
            ratings_subquery.c.average_rating,
            func.coalesce(ratings_subquery.c.ratings_count, 0).label("ratings_count"),
            user_ratings_subquery.c.user_rating,
            case((favorites_subquery.c.recipe_id.is_not(None), True), else_=False).label("is_favorite"),
        )
        .options(selectinload(Recipe.tag_links).selectinload(RecipeTag.tag))
        .outerjoin(ratings_subquery, ratings_subquery.c.recipe_id == Recipe.id)
        .outerjoin(user_ratings_subquery, user_ratings_subquery.c.recipe_id == Recipe.id)
        .outerjoin(favorites_subquery, favorites_subquery.c.recipe_id == Recipe.id)
    )


def _serialize_recipe(
    recipe: Recipe,
    average_rating: float | None,
    ratings_count: int,
    user_rating: int | None,
    is_favorite: bool,
) -> RecipeResponse:
    return RecipeResponse(
        id=recipe.id,
        name=recipe.name,
        description=recipe.description,
        image=recipe.image,
        prep_time_minutes=recipe.prep_time_minutes,
        servings=recipe.servings,
        ingredients=recipe.ingredients,
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
        average_rating=float(average_rating) if average_rating is not None else None,
        ratings_count=ratings_count,
        user_rating=user_rating,
        is_favorite=is_favorite,
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

    if tags:
        normalized_tags = sorted({tag.strip() for tag in tags if tag.strip()})
        if normalized_tags:
            query = (
                query.join(RecipeTag, RecipeTag.recipe_id == Recipe.id)
                .join(Tag, Tag.id == RecipeTag.tag_id)
                .filter(Tag.slug.in_(normalized_tags))
                .distinct()
            )

    rows = query.order_by(Recipe.name.asc()).all()
    return [
        _serialize_recipe(recipe, average_rating, ratings_count, user_rating, is_favorite)
        for recipe, average_rating, ratings_count, user_rating, is_favorite in rows
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

    recipe, average_rating, ratings_count, user_rating, is_favorite = row
    return _serialize_recipe(recipe, average_rating, ratings_count, user_rating, is_favorite)


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
    grouped: dict[TagCategory, list[TagResponse]] = {
        TagCategory.meal_type: [],
        TagCategory.cuisine: [],
        TagCategory.occasion: [],
    }
    for tag in tags:
        grouped[tag.category].append(TagResponse.model_validate(tag))

    return TagGroupsResponse(
        meal_type=grouped[TagCategory.meal_type],
        cuisine=grouped[TagCategory.cuisine],
        occasion=grouped[TagCategory.occasion],
    )
