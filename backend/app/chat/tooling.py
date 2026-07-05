from __future__ import annotations

from app.chat.tools import register_list_tools, register_list_write_tools
from app.chat.tool_registry import ToolRegistry


def build_tool_registry() -> ToolRegistry:
    registry = ToolRegistry()
    register_list_tools(registry)
    register_list_write_tools(registry)
    return registry
