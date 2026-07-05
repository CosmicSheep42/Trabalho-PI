from __future__ import annotations

from app.chat.tool_registry import ToolRegistry


def build_tool_registry() -> ToolRegistry:
    return ToolRegistry()
