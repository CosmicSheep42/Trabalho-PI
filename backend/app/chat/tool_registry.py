from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.chat.documents.tool_config_repository import ToolDefinition
from app.chat.tool_runtime import ToolHandler


@dataclass(frozen=True)
class ResolvedTool:
    name: str
    description: str
    parameters: dict[str, Any]
    executor: str
    handler: ToolHandler


class ToolRegistry:
    def __init__(self) -> None:
        self._executors: dict[str, ToolHandler] = {}

    def register(self, executor_name: str, handler: ToolHandler) -> None:
        self._executors[executor_name] = handler

    def resolve(self, definition: ToolDefinition) -> ResolvedTool | None:
        handler = self._executors.get(definition.executor)
        if handler is None:
            return None
        return ResolvedTool(
            name=definition.name,
            description=definition.description,
            parameters=definition.parameters,
            executor=definition.executor,
            handler=handler,
        )

    def list_available(self, definitions: list[ToolDefinition]) -> list[ResolvedTool]:
        return [resolved_tool for definition in definitions if (resolved_tool := self.resolve(definition)) is not None]
