from __future__ import annotations

import json
from datetime import date as dt_date
from pathlib import Path

from sqlalchemy.orm import Session, selectinload

from app.core.time import utc_now_naive
from app.models.calendar_event import CalendarEvent
from app.models.event_list import EventList
from app.models.event_member import EventMember
from app.models.friend_group import FriendGroup
from app.models.friend_group_member import FriendGroupMember
from app.models.friendship import Friendship
from app.models.list_item import ListItem
from app.models.list_member import ListMember
from app.models.list_recipe import ListRecipe
from app.models.recipe import Recipe
from app.models.shopping_list import ShoppingList
from app.models.user import User


def _home_seed_root_path() -> Path:
    current_file = Path(__file__).resolve()
    candidates = [
        current_file.parents[2] / "data" / "home",
        current_file.parents[3] / "backend" / "data" / "home",
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return candidates[0]


def _slugify_username(username: str) -> str:
    return "".join(char.lower() for char in username if char.isalnum())


def _profile_directory_for_username(username: str | None) -> Path | None:
    if not username:
        return None

    profile_dir = _home_seed_root_path() / _slugify_username(username)
    if profile_dir.exists() and profile_dir.is_dir():
        return profile_dir
    return None


def _load_profile_owner(profile_dir: Path) -> dict:
    return _load_json_file(profile_dir, "owner.json")


def _load_json_file(profile_dir: Path, filename: str) -> dict:
    file_path = profile_dir / filename
    if not file_path.exists():
        return {}

    payload = json.loads(file_path.read_text(encoding="utf-8"))
    return payload if isinstance(payload, dict) else {}


def _pair_ids(left_user_id: int, right_user_id: int) -> tuple[int, int]:
    return (left_user_id, right_user_id) if left_user_id < right_user_id else (right_user_id, left_user_id)


def _get_recipe_by_name(db: Session, recipe_name: str) -> Recipe:
    recipe = (
        db.query(Recipe)
        .options(selectinload(Recipe.ingredients))
        .filter(Recipe.name == recipe_name)
        .first()
    )
    if recipe is None:
        raise ValueError(f"Recipe '{recipe_name}' not found.")
    return recipe


def _find_or_create_support_user(db: Session, spec: dict) -> User:
    username = str(spec.get("username") or "").strip()
    if not username:
        raise ValueError("Support user seed is missing a username.")

    clerk_user_id = str(spec.get("clerk_user_id") or "").strip()
    if not clerk_user_id:
        raise ValueError(f"Support user '{username}' is missing a clerk_user_id.")

    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if user is None:
        user = db.query(User).filter(User.username == username).first()

    if user is None:
        user = User(clerk_user_id=clerk_user_id)
        db.add(user)

    user.username = username
    user.have_username = True
    user.vegan = bool(spec.get("vegan", False))
    user.vegetarian = bool(spec.get("vegetarian", False))
    user.lactose_free = bool(spec.get("lactose_free", False))
    user.egg_free = bool(spec.get("egg_free", False))
    user.gluten_free = bool(spec.get("gluten_free", False))
    user.nut_free = bool(spec.get("nut_free", False))
    user.shellfish_free = bool(spec.get("shellfish_free", False))
    user.soy_free = bool(spec.get("soy_free", False))
    user.sesame_free = bool(spec.get("sesame_free", False))
    user.sulfite_free = bool(spec.get("sulfite_free", False))
    db.add(user)
    db.flush()
    return user


def _find_or_create_profile_owner(db: Session, profile_dir: Path) -> User | None:
    owner_spec = _load_profile_owner(profile_dir)
    if not owner_spec:
        return None
    return _find_or_create_support_user(db, owner_spec)


def _ensure_friendship(db: Session, left_user_id: int, right_user_id: int) -> None:
    user_one_id, user_two_id = _pair_ids(left_user_id, right_user_id)
    friendship = (
        db.query(Friendship)
        .filter(Friendship.user_one_id == user_one_id, Friendship.user_two_id == user_two_id)
        .first()
    )
    if friendship is None:
        db.add(
            Friendship(
                user_one_id=user_one_id,
                user_two_id=user_two_id,
                created_at=utc_now_naive(),
            )
        )


def _merge_recipe_ingredients_into_list(
    shopping_list: ShoppingList,
    recipe: Recipe,
    servings: int | None,
) -> None:
    multiplier = 1.0
    if servings is not None and recipe.servings and recipe.servings > 0:
        multiplier = servings / recipe.servings

    existing_items: dict[tuple[str, str | None], ListItem] = {
        (item.name.casefold(), item.unit): item
        for item in shopping_list.items
    }

    for ingredient in recipe.ingredients:
        key = (ingredient.name.casefold(), ingredient.unit)
        quantity = round(ingredient.quantity * multiplier, 2) if ingredient.quantity is not None else None
        existing_item = existing_items.get(key)

        if existing_item is not None:
            if existing_item.quantity is not None and quantity is not None:
                existing_item.quantity += quantity
            continue

        shopping_list.items.append(
            ListItem(
                name=ingredient.name,
                quantity=quantity,
                unit=ingredient.unit,
                checked=False,
            )
        )


def _seed_support_users_and_social_data(db: Session, owner: User, profile_dir: Path) -> dict[str, User]:
    support_users_payload = _load_json_file(profile_dir, "support_users.json")
    friendships_payload = _load_json_file(profile_dir, "friendships.json")
    groups_payload = _load_json_file(profile_dir, "groups.json")

    users_by_username: dict[str, User] = {}
    for user_spec in support_users_payload.get("users", []):
        if not isinstance(user_spec, dict):
            continue
        user = _find_or_create_support_user(db, user_spec)
        users_by_username[user.username or ""] = user

    for username in friendships_payload.get("friends", []):
        friend = users_by_username.get(username)
        if friend is None:
            continue
        _ensure_friendship(db, owner.id, friend.id)

    existing_groups = {
        group.name: group
        for group in db.query(FriendGroup)
        .options(selectinload(FriendGroup.members))
        .filter(FriendGroup.user_id == owner.id)
        .all()
    }

    for group_spec in groups_payload.get("groups", []):
        if not isinstance(group_spec, dict):
            continue

        group_name = str(group_spec.get("name") or "").strip()
        if not group_name:
            continue

        group = existing_groups.get(group_name)
        now = utc_now_naive()
        if group is None:
            group = FriendGroup(
                user_id=owner.id,
                name=group_name,
                created_at=now,
                updated_at=now,
            )
            db.add(group)
            db.flush()
            existing_groups[group_name] = group
        else:
            group.updated_at = now
            (
                db.query(FriendGroupMember)
                .filter(FriendGroupMember.group_id == group.id)
                .delete(synchronize_session=False)
            )
            db.flush()

        for member_username in group_spec.get("members", []):
            member_user = users_by_username.get(member_username)
            if member_user is None:
                continue
            group.members.append(FriendGroupMember(friend_user_id=member_user.id))
        db.add(group)

    return users_by_username


def _seed_lists(db: Session, owner: User, profile_dir: Path, users_by_username: dict[str, User]) -> dict[str, ShoppingList]:
    lists_payload = _load_json_file(profile_dir, "lists.json")
    list_map: dict[str, ShoppingList] = {}

    for list_spec in lists_payload.get("lists", []):
        if not isinstance(list_spec, dict):
            continue

        key = str(list_spec.get("key") or "").strip()
        name = str(list_spec.get("name") or "").strip()
        color = str(list_spec.get("color") or "").strip()
        if not key or not name or not color:
            continue

        shopping_list = ShoppingList(
            user_id=owner.id,
            name=name,
            color=color,
            date=dt_date.fromisoformat(list_spec["date"]) if list_spec.get("date") else None,
        )

        for item_spec in list_spec.get("items", []):
            if not isinstance(item_spec, dict):
                continue
            item_name = str(item_spec.get("name") or "").strip()
            if not item_name:
                continue
            shopping_list.items.append(
                ListItem(
                    name=item_name,
                    quantity=item_spec.get("quantity"),
                    unit=item_spec.get("unit"),
                    checked=bool(item_spec.get("checked", False)),
                )
            )

        for recipe_spec in list_spec.get("recipes", []):
            if not isinstance(recipe_spec, dict):
                continue
            recipe_name = str(recipe_spec.get("name") or "").strip()
            if not recipe_name:
                continue
            recipe = _get_recipe_by_name(db, recipe_name)
            servings = recipe_spec.get("servings")
            shopping_list.recipe_links.append(
                ListRecipe(
                    recipe_id=recipe.id,
                    servings=servings,
                )
            )
            _merge_recipe_ingredients_into_list(shopping_list, recipe, servings)

        db.add(shopping_list)
        db.flush()

        now = utc_now_naive()
        for collaborator_username in list_spec.get("collaborators", []):
            collaborator = users_by_username.get(collaborator_username)
            if collaborator is None:
                continue
            shopping_list.shared_memberships.append(
                ListMember(
                    user_id=collaborator.id,
                    invited_by_user_id=owner.id,
                    created_at=now,
                )
            )

        list_map[key] = shopping_list
        db.add(shopping_list)

    return list_map


def _seed_events(
    db: Session,
    owner: User,
    profile_dir: Path,
    users_by_username: dict[str, User],
    list_map: dict[str, ShoppingList],
) -> None:
    events_payload = _load_json_file(profile_dir, "events.json")

    for event_spec in events_payload.get("events", []):
        if not isinstance(event_spec, dict):
            continue

        name = str(event_spec.get("name") or "").strip()
        icon = str(event_spec.get("icon") or "").strip()
        if not name or not icon or not event_spec.get("date"):
            continue

        calendar_event = CalendarEvent(
            user_id=owner.id,
            name=name,
            description=str(event_spec.get("description") or ""),
            icon=icon,
            date=dt_date.fromisoformat(event_spec["date"]),
        )
        db.add(calendar_event)
        db.flush()

        for list_key in event_spec.get("list_keys", []):
            shopping_list = list_map.get(list_key)
            if shopping_list is None:
                continue
            calendar_event.list_links.append(EventList(list_id=shopping_list.id))

        now = utc_now_naive()
        for member_username in event_spec.get("members", []):
            member_user = users_by_username.get(member_username)
            if member_user is None:
                continue
            calendar_event.shared_memberships.append(
                EventMember(
                    user_id=member_user.id,
                    invited_by_user_id=owner.id,
                    created_at=now,
                )
            )

        db.add(calendar_event)


def _clear_owned_lists_and_events(db: Session, user: User) -> None:
    for event in db.query(CalendarEvent).filter(CalendarEvent.user_id == user.id).all():
        db.delete(event)

    for shopping_list in db.query(ShoppingList).filter(ShoppingList.user_id == user.id).all():
        db.delete(shopping_list)

    for group in db.query(FriendGroup).filter(FriendGroup.user_id == user.id).all():
        db.delete(group)

    user.has_seeded_home_content = False
    db.add(user)


def _find_owner_for_profile(db: Session, profile_dir: Path) -> User | None:
    owner = _find_or_create_profile_owner(db, profile_dir)
    if owner is not None:
        return owner

    users = db.query(User).filter(User.username.isnot(None)).all()
    for user in users:
        if _slugify_username(user.username or "") == profile_dir.name:
            return user
    return None


def seed_configured_home_profiles(db: Session) -> bool:
    changed = False

    root_path = _home_seed_root_path()
    if not root_path.exists():
        return False

    for profile_dir in sorted(path for path in root_path.iterdir() if path.is_dir()):
        owner = _find_owner_for_profile(db, profile_dir)
        if owner is None:
            continue

        _seed_support_users_and_social_data(db, owner, profile_dir)
        changed = seed_home_content_for_user(db, owner) or changed

    return changed


def reseed_configured_home_profiles(db: Session) -> bool:
    changed = False

    root_path = _home_seed_root_path()
    if not root_path.exists():
        return False

    for profile_dir in sorted(path for path in root_path.iterdir() if path.is_dir()):
        owner = _find_owner_for_profile(db, profile_dir)
        if owner is None:
            continue

        support_users_payload = _load_json_file(profile_dir, "support_users.json")
        support_user_specs = [spec for spec in support_users_payload.get("users", []) if isinstance(spec, dict)]
        support_users_by_username = {
            str(spec.get("username") or ""): spec
            for spec in support_user_specs
        }

        for support_username in support_users_by_username:
            support_user = db.query(User).filter(User.username == support_username).first()
            if support_user is None:
                continue
            if not support_users_by_username[support_username].get("reset_home_content", False):
                continue
            _clear_owned_lists_and_events(db, support_user)

        _clear_owned_lists_and_events(db, owner)

        users_by_username = _seed_support_users_and_social_data(db, owner, profile_dir)

        for user_spec in support_users_payload.get("users", []):
            if not isinstance(user_spec, dict):
                continue
        list_map = _seed_lists(db, owner, profile_dir, users_by_username)
        _seed_events(db, owner, profile_dir, users_by_username, list_map)
        owner.has_seeded_home_content = True
        db.add(owner)
        changed = True

    return changed


def seed_home_content_for_user(db: Session, user: User) -> bool:
    if user.has_seeded_home_content:
        return False

    profile_dir = _profile_directory_for_username(user.username)
    if profile_dir is None:
        user.has_seeded_home_content = True
        db.add(user)
        return True

    users_by_username = _seed_support_users_and_social_data(db, user, profile_dir)
    list_map = _seed_lists(db, user, profile_dir, users_by_username)
    _seed_events(db, user, profile_dir, users_by_username, list_map)
    user.has_seeded_home_content = True
    db.add(user)
    return True
