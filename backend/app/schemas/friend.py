from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FriendUserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str


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


class FriendsOverviewResponse(BaseModel):
    friends: list[FriendUserSummary]
    incoming_requests: list[FriendshipRequestSummary]
    outgoing_requests: list[FriendshipRequestSummary]
