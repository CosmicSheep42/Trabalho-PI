from __future__ import annotations

from app.chat.tools import register_event_tools, register_list_tools, register_recipe_tools, register_saved_recipe_tools
from app.chat.tool_registry import ToolRegistry


def build_tool_registry() -> ToolRegistry:
    registry = ToolRegistry()
    register_event_tools(registry)
    register_list_tools(registry)
    register_recipe_tools(registry)
    register_saved_recipe_tools(registry)
    return registry
