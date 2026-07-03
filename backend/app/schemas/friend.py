from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FriendUserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    clerk_user_id: str


class FriendshipRequestPayload(BaseModel):
    username: str


class FriendshipRequestSummary(BaseModel):
    id: int
    status: str
    created_at: datetime
    user: FriendUserSummary


class FriendSearchResult(BaseModel):
    user: FriendUserSummary
    relation_status: str


class FriendGroupPayload(BaseModel):
    name: str
    friend_user_ids: list[int]


class FriendGroupSummary(BaseModel):
    id: int
    name: str
    members: list[FriendUserSummary]


class FriendsOverviewResponse(BaseModel):
    friends: list[FriendUserSummary]
    incoming_requests: list[FriendshipRequestSummary]
    outgoing_requests: list[FriendshipRequestSummary]
    groups: list[FriendGroupSummary]
