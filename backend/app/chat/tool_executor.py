from __future__ import annotations

import re

from app.chat.ollama_tool_client import ToolCall
from app.chat.tool_registry import ResolvedTool
from app.chat.tool_runtime import ExecutedToolCall, ToolExecutionContext, ToolExecutionResult


class ToolExecutor:
    def execute(
        self,
        tool_calls: list[ToolCall],
        *,
        available_tools: dict[str, ResolvedTool],
        context: ToolExecutionContext,
    ) -> list[ExecutedToolCall]:
        executed_calls: list[ExecutedToolCall] = []
        for tool_call in tool_calls:
            if tool_call.name == "add_recipe_to_list":
                expanded_calls = self._expand_compound_recipe_call(
                    tool_call,
                    available_tools=available_tools,
                    context=context,
                )
                if expanded_calls:
                    for expanded_call in expanded_calls:
                        executed_calls.extend(
                            self.execute(
                                [expanded_call],
                                available_tools=available_tools,
                                context=context,
                            )
                        )
                    continue

            if tool_call.name == "add_recipe_to_list":
                executed_calls.extend(
                    self._execute_recipe_search_prerequisite(
                        tool_call,
                        available_tools=available_tools,
                        context=context,
                    )
                )
            resolved_tool = available_tools.get(tool_call.name)
            if resolved_tool is None:
                executed_calls.append(
                    ExecutedToolCall(
                        id=tool_call.id,
                        name=tool_call.name,
                        arguments=tool_call.arguments,
                        success=False,
                        message="The requested tool is not available.",
                        error=f"Unknown tool '{tool_call.name}'.",
                    )
                )
                continue

            try:
                result = resolved_tool.handler(context, tool_call.arguments)
            except Exception as exc:
                result = ToolExecutionResult(
                    success=False,
                    message="The tool execution failed.",
                    error=str(exc),
                )

            executed_calls.append(
                ExecutedToolCall(
                    id=tool_call.id,
                    name=tool_call.name,
                    arguments=tool_call.arguments,
                    success=result.success,
                    message=result.message,
                    data=result.data,
                    error=result.error,
                )
            )

        return executed_calls

    def _expand_compound_recipe_call(
        self,
        tool_call: ToolCall,
        *,
        available_tools: dict[str, ResolvedTool],
        context: ToolExecutionContext,
    ) -> list[ToolCall]:
        recipe_name = tool_call.arguments.get("recipe_name")
        if not isinstance(recipe_name, str) or not recipe_name.strip():
            return []

        recipe_names = self._split_recipe_names(recipe_name)
        if len(recipe_names) <= 1:
            return []

        if self._recipe_search_has_exact_match(
            recipe_name,
            available_tools=available_tools,
            context=context,
        ):
            return []

        return [
            ToolCall(
                id=f"{tool_call.id}_recipe_{index}",
                name=tool_call.name,
                arguments={**tool_call.arguments, "recipe_name": split_recipe_name},
            )
            for index, split_recipe_name in enumerate(recipe_names, start=1)
        ]

    def _split_recipe_names(self, recipe_name: str) -> list[str]:
        normalized_name = recipe_name.strip()
        if not re.search(r"\s(?:e|and)\s|[,;/]", normalized_name, flags=re.IGNORECASE):
            return [normalized_name]
        return [
            candidate.strip(" .")
            for candidate in re.split(r"\s*(?:[,;/]|\s+e\s+|\s+and\s+)\s*", normalized_name, flags=re.IGNORECASE)
            if candidate.strip(" .")
        ]

    def _recipe_search_has_exact_match(
        self,
        recipe_name: str,
        *,
        available_tools: dict[str, ResolvedTool],
        context: ToolExecutionContext,
    ) -> bool:
        search_tool = available_tools.get("search_recipes")
        if search_tool is None:
            return False

        try:
            result = search_tool.handler(context, {"search": recipe_name.strip(), "limit": 8})
        except Exception:
            return False

        recipes = result.data.get("recipes") if isinstance(result.data, dict) else None
        if not isinstance(recipes, list):
            return False
        normalized_recipe_name = recipe_name.strip().casefold()
        for recipe in recipes:
            if not isinstance(recipe, dict):
                continue
            candidate_name = recipe.get("name")
            if isinstance(candidate_name, str) and candidate_name.strip().casefold() == normalized_recipe_name:
                return True
        return False

    def _execute_recipe_search_prerequisite(
        self,
        tool_call: ToolCall,
        *,
        available_tools: dict[str, ResolvedTool],
        context: ToolExecutionContext,
    ) -> list[ExecutedToolCall]:
        search_tool = available_tools.get("search_recipes")
        recipe_name = tool_call.arguments.get("recipe_name")
        if search_tool is None or not isinstance(recipe_name, str) or not recipe_name.strip():
            return []

        search_arguments = {"search": recipe_name.strip(), "limit": 8}
        search_call_id = f"{tool_call.id}_search_recipes"

        try:
            result = search_tool.handler(context, search_arguments)
        except Exception as exc:
            result = ToolExecutionResult(
                success=False,
                message="The recipe search prerequisite failed.",
                error=str(exc),
            )

        return [
            ExecutedToolCall(
                id=search_call_id,
                name=search_tool.name,
                arguments=search_arguments,
                success=result.success,
                message=result.message,
                data=result.data,
                error=result.error,
            )
        ]
