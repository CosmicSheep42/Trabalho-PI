from __future__ import annotations

from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    query: str = Field(min_length=1, max_length=1000)


class ChatToolCall(BaseModel):
    id: str
    name: str
    arguments: dict


class ChatExecutedToolCall(BaseModel):
    id: str
    name: str
    arguments: dict
    success: bool
    message: str
    data: dict = Field(default_factory=dict)
    error: str | None = None


class ChatMessageResponse(BaseModel):
    result: str
    route: str
    reason: str
    matched_category: str | None = None
    matched_intent: str | None = None
    score: float | None = None
    tool_calls: list[ChatToolCall] = Field(default_factory=list)
    executed_tool_calls: list[ChatExecutedToolCall] = Field(default_factory=list)
    tool_calling_used: bool = False
    tool_calling_available: bool = False


class ChatSessionClearResponse(BaseModel):
    success: bool
