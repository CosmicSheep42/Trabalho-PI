from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.chat.documents.prompt_repository import MasterPromptRepository
from app.chat.documents.tool_config_repository import ToolCallingConfigRepository
from app.chat.ollama_tool_client import OllamaToolCallingClient, ToolSpec
from app.chat.session_cache import SessionConversationCache
from app.chat.tool_executor import ToolExecutor
from app.chat.tool_registry import ResolvedTool, ToolRegistry
from app.chat.tool_runtime import ExecutedToolCall, ToolExecutionContext
from app.chat.tooling import build_tool_registry
from app.core.config import settings


@dataclass(frozen=True)
class ChatServiceResult:
    content: str
    tool_calls: list[dict[str, Any]]
    executed_tool_calls: list[dict[str, Any]]


class ChatService:
    def __init__(
        self,
        *,
        assets_dir: Path,
        session_cache: SessionConversationCache | None = None,
        tool_registry: ToolRegistry | None = None,
    ) -> None:
        self.assets_dir = assets_dir
        self.master_prompt_repository = MasterPromptRepository(assets_dir / "master_prompt.json")
        self.tool_config_repository = ToolCallingConfigRepository(assets_dir / "tool_calling.json")
        self.client = OllamaToolCallingClient(
            base_url=settings.ollama_base_url,
            default_model=settings.generation_model,
            temperature=settings.generation_temperature,
        )
        self.session_cache = session_cache or SessionConversationCache(
            ttl_seconds=settings.chat_session_ttl_seconds,
            max_messages=settings.chat_session_message_limit,
        )
        self.tool_registry = tool_registry or build_tool_registry()
        self.tool_executor = ToolExecutor()
        self._master_prompt: str | None = None
        self._tool_config = None

    def clear_session(self, session_id: str) -> None:
        self.session_cache.clear(session_id)

    def chat(self, session_id: str, user_id: int, user_message: str) -> ChatServiceResult:
        available_tools = self._get_available_tools()
        messages = [
            {"role": "system", "content": self._build_system_prompt(user_message, available_tools)},
            *self.session_cache.get_messages(session_id),
            {"role": "user", "content": user_message},
        ]
        tool_specs = self._build_tool_specs(available_tools)
        tool_calling_available = bool(tool_specs) and settings.tool_calling_enabled
        tool_calls: list[dict[str, Any]] = []
        executed_tool_calls: list[dict[str, Any]] = []

        if tool_calling_available:
            execution_context = ToolExecutionContext(session_id=session_id, user_id=user_id)
            available_tools_by_name = {tool.name: tool for tool in available_tools}

            # Run the tool loop first, then ask for a final natural-language answer.
            for _ in range(max(1, settings.tool_calling_max_rounds)):
                raw_result = self.client.chat(
                    messages,
                    tools=tool_specs,
                    model=settings.tool_calling_model,
                )
                current_tool_calls = self._serialize_tool_calls(raw_result.tool_calls)
                tool_calls.extend(current_tool_calls)
                if not raw_result.tool_calls:
                    content = raw_result.content or "I couldn't generate a response right now."
                    self.session_cache.append_exchange(session_id, user_message, content)
                    return ChatServiceResult(
                        content=content,
                        tool_calls=tool_calls,
                        executed_tool_calls=executed_tool_calls,
                    )

                messages.append(self._build_assistant_tool_call_message(raw_result.content, raw_result.tool_calls))

                current_executions = self.tool_executor.execute(
                    raw_result.tool_calls,
                    available_tools=available_tools_by_name,
                    context=execution_context,
                )
                executed_tool_calls.extend(
                    [executed_call.to_payload() for executed_call in current_executions]
                )
                messages.extend(self._build_tool_result_messages(current_executions))

            final_result = self.client.chat(
                messages,
                tools=None,
                model=settings.generation_model,
            )
            content = final_result.content or "I couldn't complete the requested actions right now."
            self.session_cache.append_exchange(session_id, user_message, content)
            return ChatServiceResult(
                content=content,
                tool_calls=tool_calls,
                executed_tool_calls=executed_tool_calls,
            )

        raw_result = self.client.chat(
            messages,
            tools=None,
            model=settings.generation_model,
        )
        content = raw_result.content or "I couldn't generate a response right now."
        self.session_cache.append_exchange(session_id, user_message, content)
        return ChatServiceResult(
            content=content,
            tool_calls=[],
            executed_tool_calls=[],
        )

    def _build_system_prompt(self, user_message: str, available_tools: list[ResolvedTool]) -> str:
        master_prompt = self._get_master_prompt()
        tool_config = self._get_tool_config()
        if not settings.tool_calling_enabled:
            return master_prompt

        available_tool_names = ", ".join(tool.name for tool in available_tools) or "No callable tools are active."
        retrieval_guidance = (
            "Use the conversation and your general reasoning first. "
            "Only call tools when the user is asking for an action or data that depends on application state. "
            f"Currently available tools: {available_tool_names}."
        )

        return tool_config.system_prompt_template.format(
            master_prompt=master_prompt,
            user_question=user_message,
            current_context="No external retrieval context is injected in this mode.",
            retrieval_guidance=retrieval_guidance,
        )

    def _build_tool_specs(self, available_tools: list[ResolvedTool]) -> list[ToolSpec]:
        if not settings.tool_calling_enabled:
            return []

        tool_specs: list[ToolSpec] = []
        for configured_tool in available_tools:
            tool_specs.append(
                ToolSpec(
                    name=configured_tool.name,
                    description=configured_tool.description,
                    parameters=configured_tool.parameters,
                )
            )
        return tool_specs

    def _get_master_prompt(self) -> str:
        if self._master_prompt is None:
            self._master_prompt = self.master_prompt_repository.load()
        return self._master_prompt

    def _get_available_tools(self) -> list[ResolvedTool]:
        config = self._get_tool_config()
        return self.tool_registry.list_available(config.tools)

    def _get_tool_config(self):
        if self._tool_config is None:
            self._tool_config = self.tool_config_repository.load()
        return self._tool_config

    def _serialize_tool_calls(self, tool_calls: list[Any]) -> list[dict[str, Any]]:
        return [
            {
                "id": tool_call.id,
                "name": tool_call.name,
                "arguments": tool_call.arguments,
            }
            for tool_call in tool_calls
        ]

    def _build_assistant_tool_call_message(self, content: str, tool_calls: list[Any]) -> dict[str, Any]:
        return {
            "role": "assistant",
            "content": content or "",
            "tool_calls": [
                {
                    "id": tool_call.id,
                    "function": {
                        "name": tool_call.name,
                        "arguments": tool_call.arguments,
                    },
                }
                for tool_call in tool_calls
            ],
        }

    def _build_tool_result_messages(self, executed_calls: list[ExecutedToolCall]) -> list[dict[str, Any]]:
        return [
            {
                "role": "tool",
                "name": executed_call.name,
                "content": json.dumps(
                    {
                        "tool_call_id": executed_call.id,
                        "result": {
                            "success": executed_call.success,
                            "message": executed_call.message,
                            "data": executed_call.data,
                            "error": executed_call.error,
                        },
                    },
                    ensure_ascii=True,
                ),
            }
            for executed_call in executed_calls
        ]
