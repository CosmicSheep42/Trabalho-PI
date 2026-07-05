from __future__ import annotations

from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload

from app.api.routes.lists import _are_friends, _get_accessible_list
from app.chat.tool_registry import ToolRegistry
from app.chat.tool_runtime import ToolExecutionContext, ToolExecutionResult
from app.chat.tools.list_tools import _serialize_list_details, _serialize_user_summary
from app.core.time import utc_now_naive
from app.db.session import SessionLocal
from app.models.friend_group import FriendGroup
from app.models.friend_group_member import FriendGroupMember
from app.models.friendship import Friendship
from app.models.list_member import ListMember
from app.models.shopping_list import ShoppingList
from app.models.user import User


def register_list_share_tools(registry: ToolRegistry) -> None:
    registry.register("lists.share.list_list_members", list_list_members_tool)
    registry.register("lists.share.find_friend_by_name", find_friend_by_name_tool)
    registry.register("lists.share.find_group_by_name", find_group_by_name_tool)
    registry.register("lists.share.share_list_with_friend", share_list_with_friend_tool)
    registry.register("lists.share.share_list_with_group", share_list_with_group_tool)
    registry.register("lists.share.unshare_list_with_friend", unshare_list_with_friend_tool)


def list_list_members_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    list_id = _coerce_int(arguments.get("list_id"))
    if list_id is None:
        return _missing_argument_result("list_id")

    with SessionLocal() as db:
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        return ToolExecutionResult(
            success=True,
            message=f"Loaded collaborators for list '{shopping_list.name}'.",
            data={
                "list_id": shopping_list.id,
                "list_name": shopping_list.name,
                "owner": _serialize_user_summary(shopping_list.owner),
                "collaborators": [
                    _serialize_user_summary(collaborator)
                    for collaborator in shopping_list.collaborators
                ],
            },
        )


def find_friend_by_name_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    query = str(arguments.get("query") or "").strip()
    if not query:
        return _missing_argument_result("query")
    limit = _coerce_limit(arguments.get("limit"), default=5)

    with SessionLocal() as db:
        friendship_rows = (
            db.query(Friendship)
            .filter(or_(Friendship.user_one_id == context.user_id, Friendship.user_two_id == context.user_id))
            .all()
        )
        friend_ids = [
            friendship.user_two_id if friendship.user_one_id == context.user_id else friendship.user_one_id
            for friendship in friendship_rows
        ]
        friends: list[User] = []
        if friend_ids:
            friends = (
                db.query(User)
                .filter(
                    User.id.in_(friend_ids),
                    User.username.isnot(None),
                    func.lower(User.username).like(f"%{query.lower()}%"),
                )
                .order_by(func.lower(User.username).asc(), User.id.asc())
                .limit(limit)
                .all()
            )

        return ToolExecutionResult(
            success=True,
            message=f"Found {len(friends)} friend match(es) for '{query}'.",
            data={
                "query": query,
                "matches": [_serialize_user_summary(friend) for friend in friends],
            },
        )


def find_group_by_name_tool(context: ToolExecutionContext, arguments: dict[str, object]) -> ToolExecutionResult:
    query = str(arguments.get("query") or "").strip()
    if not query:
        return _missing_argument_result("query")
    limit = _coerce_limit(arguments.get("limit"), default=5)

    with SessionLocal() as db:
        groups = (
            db.query(FriendGroup)
            .options(selectinload(FriendGroup.members).selectinload(FriendGroupMember.friend_user))
            .filter(
                FriendGroup.user_id == context.user_id,
                func.lower(FriendGroup.name).like(f"%{query.lower()}%"),
            )
            .order_by(func.lower(FriendGroup.name).asc(), FriendGroup.id.asc())
            .limit(limit)
            .all()
        )

        return ToolExecutionResult(
            success=True,
            message=f"Found {len(groups)} group match(es) for '{query}'.",
            data={
                "query": query,
                "matches": [
                    {
                        "id": group.id,
                        "name": group.name,
                        "member_count": len(group.members),
                        "members": [
                            _serialize_user_summary(member.friend_user)
                            for member in group.members
                            if member.friend_user is not None
                        ],
                    }
                    for group in groups
                ],
            },
        )


def share_list_with_friend_tool(
    context: ToolExecutionContext,
    arguments: dict[str, object],
) -> ToolExecutionResult:
    list_id = _coerce_int(arguments.get("list_id"))
    friend_user_id = _coerce_int(arguments.get("friend_user_id"))
    if list_id is None:
        return _missing_argument_result("list_id")
    if friend_user_id is None:
        return _missing_argument_result("friend_user_id")

    with SessionLocal() as db:
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        result = _share_with_user_ids(
            db,
            shopping_list=shopping_list,
            current_user_id=context.user_id,
            candidate_friend_ids=[friend_user_id],
        )
        if result is not None:
            return result
        db.commit()
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        return ToolExecutionResult(
            success=True,
            message=f"Shared list '{shopping_list.name}' with friend {friend_user_id}.",
            data={"list": _serialize_list_details(shopping_list)},
        )


def share_list_with_group_tool(
    context: ToolExecutionContext,
    arguments: dict[str, object],
) -> ToolExecutionResult:
    list_id = _coerce_int(arguments.get("list_id"))
    group_id = _coerce_int(arguments.get("group_id"))
    if list_id is None:
        return _missing_argument_result("list_id")
    if group_id is None:
        return _missing_argument_result("group_id")

    with SessionLocal() as db:
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        group = (
            db.query(FriendGroup)
            .options(selectinload(FriendGroup.members))
            .filter(FriendGroup.user_id == context.user_id, FriendGroup.id == group_id)
            .first()
        )
        if group is None:
            return ToolExecutionResult(
                success=False,
                message="I could not find that group.",
                error="Group not found.",
            )

        candidate_friend_ids = [member.friend_user_id for member in group.members]
        result = _share_with_user_ids(
            db,
            shopping_list=shopping_list,
            current_user_id=context.user_id,
            candidate_friend_ids=candidate_friend_ids,
        )
        if result is not None:
            return result
        db.commit()
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        return ToolExecutionResult(
            success=True,
            message=f"Shared list '{shopping_list.name}' with group '{group.name}'.",
            data={"list": _serialize_list_details(shopping_list)},
        )


def unshare_list_with_friend_tool(
    context: ToolExecutionContext,
    arguments: dict[str, object],
) -> ToolExecutionResult:
    list_id = _coerce_int(arguments.get("list_id"))
    member_user_id = _coerce_int(arguments.get("member_user_id"))
    if list_id is None:
        return _missing_argument_result("list_id")
    if member_user_id is None:
        return _missing_argument_result("member_user_id")

    with SessionLocal() as db:
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        if shopping_list.user_id != context.user_id:
            return ToolExecutionResult(
                success=False,
                message="Only the list owner can remove collaborators.",
                error="Forbidden collaborator removal.",
            )
        if member_user_id == shopping_list.user_id:
            return ToolExecutionResult(
                success=False,
                message="The list owner cannot be removed.",
                error="Invalid collaborator removal target.",
            )

        membership = (
            db.query(ListMember)
            .filter(ListMember.list_id == shopping_list.id, ListMember.user_id == member_user_id)
            .first()
        )
        if membership is None:
            return ToolExecutionResult(
                success=False,
                message="That collaborator does not have access to the list.",
                error="Collaborator not found.",
            )
        db.delete(membership)
        db.commit()
        shopping_list = _get_accessible_list(db, context.user_id, list_id)
        return ToolExecutionResult(
            success=True,
            message=f"Removed collaborator {member_user_id} from list '{shopping_list.name}'.",
            data={"list": _serialize_list_details(shopping_list)},
        )


def _share_with_user_ids(
    db,
    *,
    shopping_list: ShoppingList,
    current_user_id: int,
    candidate_friend_ids: list[int],
) -> ToolExecutionResult | None:
    normalized_ids = sorted(set(candidate_friend_ids))
    if not normalized_ids:
        return ToolExecutionResult(
            success=False,
            message="Select at least one friend or group member to share with.",
            error="No collaborators selected.",
        )

    existing_member_ids = {shopping_list.user_id} | {
        membership.user_id for membership in shopping_list.shared_memberships
    }
    friend_users = {
        user.id: user
        for user in db.query(User).filter(User.id.in_(normalized_ids)).all()
    }
    if len(friend_users) != len(normalized_ids):
        return ToolExecutionResult(
            success=False,
            message="I could not find one or more target users.",
            error="One or more friends were not found.",
        )

    ids_to_add: list[int] = []
    for friend_user_id in normalized_ids:
        if friend_user_id == current_user_id or friend_user_id in existing_member_ids:
            continue
        friend_user = friend_users[friend_user_id]
        if not _are_friends(db, current_user_id, friend_user.id):
            return ToolExecutionResult(
                success=False,
                message="Lists can only be shared with confirmed friends.",
                error=f"User {friend_user_id} is not a friend.",
            )
        ids_to_add.append(friend_user_id)

    if not ids_to_add:
        return ToolExecutionResult(
            success=False,
            message="All selected collaborators already have access.",
            error="No new collaborators to add.",
        )

    now = utc_now_naive()
    for friend_user_id in ids_to_add:
        db.add(
            ListMember(
                list_id=shopping_list.id,
                user_id=friend_user_id,
                invited_by_user_id=current_user_id,
                created_at=now,
            )
        )
    return None


def _coerce_int(raw_value: object) -> int | None:
    if isinstance(raw_value, bool) or raw_value is None:
        return None
    if isinstance(raw_value, int):
        return raw_value
    if isinstance(raw_value, float):
        return int(raw_value)
    if isinstance(raw_value, str):
        stripped = raw_value.strip()
        if not stripped:
            return None
        try:
            return int(stripped)
        except ValueError:
            return None
    return None


def _coerce_limit(raw_value: object, *, default: int) -> int:
    value = _coerce_int(raw_value)
    if value is None:
        return default
    return max(1, min(value, 25))


def _missing_argument_result(argument_name: str) -> ToolExecutionResult:
    return ToolExecutionResult(
        success=False,
        message=f"A valid {argument_name} is required.",
        error=f"Missing required argument '{argument_name}'.",
    )
