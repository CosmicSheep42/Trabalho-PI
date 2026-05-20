from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy.orm import Session, selectinload

from app.models.holiday import Holiday
from app.models.recipe import Recipe
from app.models.recipe_holiday import RecipeHoliday
from app.models.recipe_ingredient import RecipeIngredient
from app.models.recipe_tag import RecipeTag
from app.models.tag import Tag, TagCategory

LEGACY_WEATHER_SLUGS = {"cold-day", "hot-day"}
HOLIDAY_SLUGS = {
    "christmas",
    "thanksgiving",
    "easter",
    "halloween",
    "valentines-day",
    "new-year",
}


def _recipes_directory_path() -> Path:
    current_file = Path(__file__).resolve()
    candidates = [
        current_file.parents[2] / "data" / "recipes",
        current_file.parents[3] / "backend" / "data" / "recipes",
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return candidates[0]


def _recipe_files() -> list[Path]:
    recipes_directory = _recipes_directory_path()
    if not recipes_directory.exists() or not recipes_directory.is_dir():
        return []

    return sorted(path for path in recipes_directory.iterdir() if path.is_file())


def _load_recipes_payload() -> list[dict]:
    recipes: list[dict] = []

    for recipe_file in _recipe_files():
        payload = json.loads(recipe_file.read_text(encoding="utf-8"))
        if isinstance(payload, dict):
            file_recipes = payload.get("recipes", [])
        elif isinstance(payload, list):
            file_recipes = payload
        else:
            continue

        for recipe_data in file_recipes:
            if isinstance(recipe_data, dict):
                recipes.append(recipe_data)

    return recipes


def _format_tag_name(slug: str) -> str:
    return slug.replace("-", " ").title()


def _parse_amount(value: str) -> tuple[float | None, str | None]:
    raw_value = value.strip()
    if not raw_value:
        return None, None

    number_chars: list[str] = []
    rest_start_index = 0
    for index, char in enumerate(raw_value):
        if char.isdigit() or char in {".", ","}:
            number_chars.append(char)
            rest_start_index = index + 1
            continue
        if char.isspace() and number_chars:
            rest_start_index = index + 1
            break
        if not number_chars:
            return None, raw_value
        break

    if not number_chars:
        return None, raw_value

    try:
        quantity = float("".join(number_chars).replace(",", "."))
    except ValueError:
        return None, raw_value

    unit = raw_value[rest_start_index:].strip() or None
    return quantity, unit


def _normalize_recipe_classifications(recipe_data: dict) -> tuple[dict[TagCategory, str], list[str]]:
    normalized_tags: dict[TagCategory, str] = {}
    normalized_holidays: list[str] = []

    for category_name, raw_slug in (recipe_data.get("tags") or {}).items():
        slug = str(raw_slug).strip()
        if not slug:
            continue

        if category_name == TagCategory.occasion.value and slug in LEGACY_WEATHER_SLUGS:
            normalized_tags[TagCategory.weather] = slug
            continue

        if category_name == TagCategory.occasion.value and slug in HOLIDAY_SLUGS:
            normalized_tags[TagCategory.occasion] = "holidays"
            if slug not in normalized_holidays:
                normalized_holidays.append(slug)
            continue

        try:
            category = TagCategory(category_name)
        except ValueError:
            continue

        normalized_tags[category] = slug

    for raw_slug in (recipe_data.get("holidays") or []):
        slug = str(raw_slug).strip()
        if not slug:
            continue
        if slug not in normalized_holidays:
            normalized_holidays.append(slug)

    if normalized_holidays:
        normalized_tags[TagCategory.occasion] = "holidays"

    return normalized_tags, normalized_holidays


def _delete_orphan_taxonomies(db: Session) -> None:
    orphan_tags = (
        db.query(Tag)
        .outerjoin(RecipeTag, RecipeTag.tag_id == Tag.id)
        .filter(RecipeTag.recipe_id.is_(None))
        .all()
    )
    for tag in orphan_tags:
        db.delete(tag)

    orphan_holidays = (
        db.query(Holiday)
        .outerjoin(RecipeHoliday, RecipeHoliday.holiday_id == Holiday.id)
        .filter(RecipeHoliday.recipe_id.is_(None))
        .all()
    )
    for holiday in orphan_holidays:
        db.delete(holiday)


def seed_recipes_from_data_directory(db: Session) -> None:
    recipes_data = _load_recipes_payload()
    if not recipes_data:
        return

    existing_tags = {
        (tag.category, tag.slug): tag
        for tag in db.query(Tag).all()
    }
    existing_tags_by_slug = {
        tag.slug: tag
        for tag in db.query(Tag).all()
    }
    existing_holidays = {
        holiday.slug: holiday
        for holiday in db.query(Holiday).all()
    }
    existing_recipes = {
        recipe.name: recipe
        for recipe in db.query(Recipe)
        .options(
            selectinload(Recipe.ingredients),
            selectinload(Recipe.tag_links),
            selectinload(Recipe.holiday_links),
        )
        .all()
    }
    existing_recipes_by_description = {
        recipe.description: recipe
        for recipe in existing_recipes.values()
    }

    for recipe_data in recipes_data:
        recipe = existing_recipes.get(recipe_data["name"])
        if recipe is None:
            recipe = existing_recipes_by_description.get(recipe_data["description"])
        if recipe is None:
            recipe = Recipe(name=recipe_data["name"])
            db.add(recipe)
            existing_recipes[recipe.name] = recipe

        dietary_flags = recipe_data.get("dietary_flags", {})
        recipe.name = recipe_data["name"]
        recipe.description = recipe_data["description"]
        recipe.image = recipe_data["image"]
        recipe.prep_time_minutes = recipe_data.get("prep_time_minutes", 0)
        recipe.servings = recipe_data.get("servings")
        recipe.instructions = recipe_data.get("instructions", [])
        recipe.vegan = dietary_flags.get("vegan", False)
        recipe.vegetarian = dietary_flags.get("vegetarian", False)
        recipe.lactose_free = dietary_flags.get("lactose_free", False)
        recipe.egg_free = dietary_flags.get("egg_free", False)
        recipe.gluten_free = dietary_flags.get("gluten_free", False)
        recipe.nut_free = dietary_flags.get("nut_free", False)
        recipe.shellfish_free = dietary_flags.get("shellfish_free", False)
        recipe.soy_free = dietary_flags.get("soy_free", False)
        recipe.sesame_free = dietary_flags.get("sesame_free", False)
        recipe.sulfite_free = dietary_flags.get("sulfite_free", False)
        existing_recipes[recipe.name] = recipe
        existing_recipes_by_description[recipe.description] = recipe

        recipe.ingredients.clear()
        for ingredient_data in recipe_data.get("ingredients", []):
            quantity, unit = _parse_amount(ingredient_data.get("amount", ""))
            recipe.ingredients.append(
                RecipeIngredient(
                    name=ingredient_data["name"],
                    quantity=quantity,
                    unit=unit,
                )
            )

        normalized_tags, holiday_slugs = _normalize_recipe_classifications(recipe_data)

        recipe.tag_links.clear()
        for category, slug in normalized_tags.items():
            tag = existing_tags.get((category, slug))
            if tag is None:
                tag = existing_tags_by_slug.get(slug)
                if tag is None:
                    tag = Tag(
                        name=_format_tag_name(slug),
                        slug=slug,
                        category=category,
                    )
                    db.add(tag)
                    db.flush()
                    existing_tags_by_slug[slug] = tag
                else:
                    tag.name = _format_tag_name(slug)
                    tag.category = category

                existing_tags[(category, slug)] = tag

            recipe.tag_links.append(RecipeTag(tag_id=tag.id))

        recipe.holiday_links.clear()
        for slug in holiday_slugs:
            holiday = existing_holidays.get(slug)
            if holiday is None:
                holiday = Holiday(
                    name=_format_tag_name(slug),
                    slug=slug,
                )
                db.add(holiday)
                db.flush()
                existing_holidays[slug] = holiday

            recipe.holiday_links.append(RecipeHoliday(holiday_id=holiday.id))

    _delete_orphan_taxonomies(db)
    db.commit()


def seed_recipes_from_file(db: Session) -> None:
    seed_recipes_from_data_directory(db)
