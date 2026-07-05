from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass(frozen=True)
class ToolExecutionContext:
    session_id: str
    user_id: int


@dataclass(frozen=True)
class ToolExecutionResult:
    success: bool
    message: str
    data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None

    def to_payload(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "success": self.success,
            "message": self.message,
            "data": self.data,
        }
        if self.error:
            payload["error"] = self.error
        return payload

    def to_message_content(self) -> str:
        return json.dumps(self.to_payload(), ensure_ascii=True)


ToolHandler = Callable[[ToolExecutionContext, dict[str, Any]], ToolExecutionResult]


@dataclass(frozen=True)
class ExecutedToolCall:
    id: str
    name: str
    arguments: dict[str, Any]
    success: bool
    message: str
    data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None

    def to_payload(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "id": self.id,
            "name": self.name,
            "arguments": self.arguments,
            "success": self.success,
            "message": self.message,
            "data": self.data,
        }
        if self.error:
            payload["error"] = self.error
        return payload
