from __future__ import annotations

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
