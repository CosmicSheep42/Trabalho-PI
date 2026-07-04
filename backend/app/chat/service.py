from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.chat.documents.prompt_repository import MasterPromptRepository
from app.chat.documents.tool_config_repository import ToolCallingConfigRepository
from app.chat.ollama_tool_client import OllamaToolCallingClient, ToolSpec
from app.chat.session_cache import SessionConversationCache
from app.chat.tool_registry import ToolRegistry
from app.core.config import settings


@dataclass(frozen=True)
class ChatServiceResult:
    content: str
    tool_calls: list[dict[str, Any]]
    tool_calling_used: bool
    tool_calling_available: bool


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
        self.tool_registry = tool_registry or ToolRegistry()
        self._master_prompt: str | None = None
        self._tool_config = None

    def clear_session(self, session_id: str) -> None:
        self.session_cache.clear(session_id)

    def append_static_exchange(self, session_id: str, user_message: str, assistant_message: str) -> None:
        self.session_cache.append_exchange(session_id, user_message, assistant_message)

    def chat(self, session_id: str, user_message: str) -> ChatServiceResult:
        messages = [
            {"role": "system", "content": self._build_system_prompt(user_message)},
            *self.session_cache.get_messages(session_id),
            {"role": "user", "content": user_message},
        ]

        tool_specs = self._build_tool_specs()
        raw_result = self.client.chat(
            messages,
            tools=tool_specs if tool_specs else None,
            model=settings.tool_calling_model if settings.tool_calling_enabled else settings.generation_model,
        )

        tool_calling_available = bool(tool_specs) and settings.tool_calling_enabled
        tool_calls = [
            {
                "id": tool_call.id,
                "name": tool_call.name,
                "arguments": tool_call.arguments,
            }
            for tool_call in raw_result.tool_calls
        ]

        content = raw_result.content or "I couldn't generate a response right now."
        self.session_cache.append_exchange(session_id, user_message, content)

        return ChatServiceResult(
            content=content,
            tool_calls=tool_calls,
            tool_calling_used=bool(tool_calls),
            tool_calling_available=tool_calling_available,
        )

    def _build_system_prompt(self, user_message: str) -> str:
        master_prompt = self._get_master_prompt()
        tool_config = self._get_tool_config()
        if not settings.tool_calling_enabled:
            return master_prompt

        return tool_config.system_prompt_template.format(
            master_prompt=master_prompt,
            user_question=user_message,
            current_context="No external context is available in this mode.",
            retrieval_guidance=(
                "Use the conversation and your general reasoning only. "
                "No document retrieval is available. "
                "Callable tools may be registered later, but none are active right now."
            ),
        )

    def _build_tool_specs(self) -> list[ToolSpec]:
        if not settings.tool_calling_enabled:
            return []

        config = self._get_tool_config()
        available_tools = {tool.name: tool for tool in self.tool_registry.list()}
        tool_specs: list[ToolSpec] = []
        for configured_tool in config.tools:
            if configured_tool.name not in available_tools:
                continue
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

    def _get_tool_config(self):
        if self._tool_config is None:
            self._tool_config = self.tool_config_repository.load()
        return self._tool_config
