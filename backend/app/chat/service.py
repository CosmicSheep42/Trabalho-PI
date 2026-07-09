from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
import re
from typing import Any

from app.chat.documents.prompt_repository import MasterPromptRepository
from app.chat.documents.tool_config_repository import ToolCallingConfigRepository
from app.chat.ollama_tool_client import OllamaToolCallingClient, ToolCall, ToolSpec
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
        self._tool_intent_patterns = (
            re.compile(
                r"\b(add|create|update|edit|delete|remove|save|share|plan|schedule|find|search|show|list|"
                r"adicionar|adicione|criar|crie|atualizar|editar|deletar|apagar|remover|salvar|"
                r"compartilhar|convide|convidar|planejar|buscar|procurar|mostrar|liste|faca|faça)\b"
            ),
            re.compile(
                r"\b(recipe|recipes|event|events|list|lists|meal|planner|calendar|saved|"
                r"receita|receitas|evento|eventos|lista|listas|refeicao|refeicoes|calendario|"
                r"pessoa|pessoas|amigo|amigos|grupo|grupos)\b"
            ),
            re.compile(r"@\w+|@\[(?:friend|group):[^\]]+\]"),
        )

    def clear_session(self, session_id: str) -> None:
        self.session_cache.clear(session_id)

    def chat(self, session_id: str, user_id: int, user_message: str) -> ChatServiceResult:
        available_tools = self._get_available_tools()
        available_tools_by_name = {tool.name: tool for tool in available_tools}
        messages = [
            {"role": "system", "content": self._build_system_prompt(user_message, available_tools)},
            *self.session_cache.get_messages(session_id),
            {"role": "user", "content": user_message},
        ]
        tool_specs = self._build_tool_specs(available_tools)
        tool_calling_available = (
            bool(tool_specs)
            and settings.tool_calling_enabled
            and self._should_enable_tool_calling(user_message)
        )
        tool_calls: list[dict[str, Any]] = []
        executed_tool_calls: list[dict[str, Any]] = []

        if tool_calling_available:
            execution_context = ToolExecutionContext(session_id=session_id, user_id=user_id)

            # Run tools first; user-facing prose is synthesized from actual execution results.
            for _ in range(max(1, settings.tool_calling_max_rounds)):
                raw_result = self.client.chat(
                    messages,
                    tools=tool_specs,
                    model=settings.tool_calling_model,
                    num_predict=settings.tool_calling_num_predict,
                )
                resolved_tool_calls = raw_result.tool_calls or self._extract_tool_calls_from_content(raw_result.content)
                current_tool_calls = self._serialize_tool_calls(resolved_tool_calls)
                tool_calls.extend(current_tool_calls)
                if not resolved_tool_calls:
                    if self._should_continue_tool_loop(user_message, executed_tool_calls):
                        messages.append(
                            {
                                "role": "user",
                                "content": (
                                    "Continue using the available tools until the user's requested actions are actually "
                                    "completed. Do not answer with tool-call JSON."
                                ),
                            }
                        )
                        continue
                    content = (
                        self._summarize_tool_execution_result(
                            [ExecutedToolCall(**payload) for payload in executed_tool_calls]
                        )
                        if executed_tool_calls
                        else raw_result.content or "Nao consegui gerar uma resposta agora."
                    )
                    self.session_cache.append_exchange(session_id, user_message, content)
                    return ChatServiceResult(
                        content=content,
                        tool_calls=tool_calls,
                        executed_tool_calls=executed_tool_calls,
                    )

                messages.append(self._build_assistant_tool_call_message(raw_result.content, resolved_tool_calls))

                current_executions = self.tool_executor.execute(
                    resolved_tool_calls,
                    available_tools=available_tools_by_name,
                    context=execution_context,
                )
                executed_tool_calls.extend(
                    [executed_call.to_payload() for executed_call in current_executions]
                )
                messages.extend(self._build_tool_result_messages(current_executions))

            content = (
                self._summarize_tool_execution_result(
                    [ExecutedToolCall(**payload) for payload in executed_tool_calls]
                )
                if executed_tool_calls
                else "Nao consegui concluir as acoes solicitadas agora."
            )
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
            num_predict=settings.generation_num_predict,
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

    def _should_enable_tool_calling(self, user_message: str) -> bool:
        normalized_message = user_message.strip().lower()
        if not normalized_message:
            return False
        return all(pattern.search(normalized_message) for pattern in self._tool_intent_patterns[:2]) or bool(
            self._tool_intent_patterns[2].search(normalized_message)
        )

    def _should_continue_tool_loop(
        self,
        user_message: str,
        executed_tool_call_payloads: list[dict[str, Any]],
    ) -> bool:
        if not executed_tool_call_payloads:
            return False
        if not self._message_requests_mutation(user_message):
            return False

        requested_categories = self._requested_mutation_categories(user_message)
        executed_categories = {
            category
            for payload in executed_tool_call_payloads
            if (category := self._tool_mutation_category(str(payload.get("name") or ""))) is not None
        }
        if requested_categories:
            return not requested_categories.issubset(executed_categories)

        return not executed_categories

    def _message_requests_mutation(self, user_message: str) -> bool:
        return bool(
            re.search(
                r"\b(add|create|update|edit|delete|remove|save|share|plan|schedule|"
                r"adicionar|adicione|criar|crie|atualizar|editar|deletar|apagar|remover|salvar|"
                r"compartilhar|convide|convidar|planejar|agendar|faca|faça)\b",
                user_message.strip().lower(),
            )
        )

    def _requested_mutation_categories(self, user_message: str) -> set[str]:
        normalized_message = user_message.strip().lower()
        categories: set[str] = set()
        if re.search(r"\b(lista|listas|list|lists)\b", normalized_message) and re.search(
            r"\b(criar|crie|faca|faça|create|make)\b",
            normalized_message,
        ):
            categories.add("list")
        if re.search(r"\b(receita|receitas|recipe|recipes)\b", normalized_message) and re.search(
            r"\b(adicionar|adicione|add|salvar|save|remover|remove)\b",
            normalized_message,
        ):
            categories.add("recipe")
        if re.search(r"@\w+|@\[", normalized_message) or re.search(
            r"\b(convide|convidar|compartilhar|invite|share)\b",
            normalized_message,
        ):
            categories.add("people")
        if re.search(r"\b(evento|eventos|event|events|calendario|calendar)\b", normalized_message):
            categories.add("event")
        if re.search(r"\b(item|itens|items)\b", normalized_message):
            categories.add("item")
        return categories

    def _tool_mutation_category(self, tool_name: str) -> str | None:
        if tool_name in {"create_list", "update_list", "delete_list"}:
            return "list"
        if tool_name in {"add_recipe_to_list", "remove_recipe_from_list", "save_recipe", "remove_saved_recipe"}:
            return "recipe"
        if tool_name == "add_people_to_list":
            return "people"
        if tool_name in {"create_event", "update_event", "delete_event", "add_lists_to_event", "remove_lists_from_event"}:
            return "event"
        if tool_name in {"create_list_item", "update_list_item", "delete_list_item"}:
            return "item"
        if tool_name.startswith(("create_", "update_", "delete_", "add_", "remove_", "save_")):
            return "other"
        return None

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

    def _summarize_tool_execution_result(self, executed_calls: list[ExecutedToolCall]) -> str:
        meaningful_calls = [call for call in executed_calls if call.name != "search_recipes"]
        if not meaningful_calls:
            return "Conclui a busca solicitada."

        successful_phrases: list[str] = []
        failed_phrases: list[str] = []
        for executed_call in meaningful_calls:
            if executed_call.success:
                phrase = self._describe_tool_call(executed_call, failed=False)
                successful_phrases.append(phrase)
            else:
                phrase = self._describe_tool_call(executed_call, failed=True)
                failed_phrases.append(phrase)

        if successful_phrases and not failed_phrases:
            return f"{self._join_phrases(successful_phrases)}."
        if successful_phrases and failed_phrases:
            return f"{self._join_phrases(successful_phrases)}. Nao consegui {self._join_phrases(failed_phrases, lowercase_first=True)}."
        return f"Nao consegui {self._join_phrases(failed_phrases, lowercase_first=True)}."

    def _describe_tool_call(self, executed_call: ExecutedToolCall, *, failed: bool) -> str:
        if executed_call.name == "create_list":
            list_name = self._read_nested_string(executed_call.data, "list", "name") or self._read_argument_string(
                executed_call.arguments,
                "name",
                "list_name",
            )
            verb = "criar" if failed else "criei"
            return f'{verb} a lista "{list_name}"' if list_name else f"{verb} a lista"

        if executed_call.name == "create_list_item":
            item_name = self._read_nested_string(executed_call.data, "item", "name") or self._read_argument_string(
                executed_call.arguments,
                "item_name",
            )
            verb = "adicionar" if failed else "adicionei"
            return f"{verb} o item {item_name}" if item_name else f"{verb} o item"

        if executed_call.name == "add_recipe_to_list":
            recipe_name = self._read_argument_string(executed_call.arguments, "recipe_name")
            verb = "adicionar" if failed else "adicionei"
            return f"{verb} a receita {recipe_name}" if recipe_name else f"{verb} a receita"

        if executed_call.name == "remove_recipe_from_list":
            recipe_name = self._read_argument_string(executed_call.arguments, "recipe_name")
            verb = "remover" if failed else "removi"
            return f"{verb} a receita {recipe_name}" if recipe_name else f"{verb} a receita"

        if executed_call.name == "add_people_to_list":
            usernames = self._read_argument_string_list(executed_call.arguments, "friend_usernames")
            groups = self._read_argument_string_list(executed_call.arguments, "group_names")
            mentions = self._read_argument_string_list(executed_call.arguments, "mentions")
            people = usernames or groups or mentions
            verb = "compartilhar" if failed else "compartilhei"
            return f"{verb} a lista com {self._format_mentions(people)}" if people else f"{verb} a lista"

        if executed_call.name == "create_event":
            event_name = self._read_nested_string(executed_call.data, "event", "name") or self._read_argument_string(
                executed_call.arguments,
                "name",
            )
            verb = "criar" if failed else "criei"
            return f'{verb} o evento "{event_name}"' if event_name else f"{verb} o evento"

        if executed_call.name == "save_recipe":
            recipe_name = self._read_argument_string(executed_call.arguments, "recipe_name")
            verb = "salvar" if failed else "salvei"
            return f"{verb} a receita {recipe_name}" if recipe_name else f"{verb} a receita"

        if executed_call.name.startswith("delete_") or executed_call.name.startswith("remove_"):
            return executed_call.message.rstrip(".").lower() if executed_call.message else "remover o item solicitado"

        return executed_call.message.rstrip(".").lower() if executed_call.message else "conclui uma acao solicitada"

    def _join_phrases(self, phrases: list[str], *, lowercase_first: bool = False) -> str:
        cleaned_phrases = [phrase.strip().rstrip(".") for phrase in phrases if phrase.strip()]
        if not cleaned_phrases:
            return "concluir a solicitacao"
        if lowercase_first:
            cleaned_phrases[0] = cleaned_phrases[0][:1].lower() + cleaned_phrases[0][1:]
        else:
            cleaned_phrases[0] = cleaned_phrases[0][:1].upper() + cleaned_phrases[0][1:]
        if len(cleaned_phrases) == 1:
            return cleaned_phrases[0]
        return f"{', '.join(cleaned_phrases[:-1])} e {cleaned_phrases[-1]}"

    def _read_argument_string(self, arguments: dict[str, Any], *keys: str) -> str | None:
        for key in keys:
            value = arguments.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        return None

    def _read_argument_string_list(self, arguments: dict[str, Any], key: str) -> list[str]:
        value = arguments.get(key)
        if not isinstance(value, list):
            return []
        return [item.strip().lstrip("@") for item in value if isinstance(item, str) and item.strip()]

    def _format_mentions(self, names: list[str]) -> str:
        formatted_names = [name if name.startswith("@") else f"@{name}" for name in names]
        if not formatted_names:
            return "as pessoas informadas"
        if len(formatted_names) == 1:
            return formatted_names[0]
        return f"{', '.join(formatted_names[:-1])} e {formatted_names[-1]}"

    def _read_nested_string(self, payload: dict[str, Any], *keys: str) -> str | None:
        current: Any = payload
        for key in keys:
            if not isinstance(current, dict):
                return None
            current = current.get(key)
        if isinstance(current, str):
            stripped = current.strip()
            return stripped or None
        return None

    def _extract_tool_calls_from_content(self, content: str) -> list[ToolCall]:
        extracted_calls: list[ToolCall] = []
        stripped_content = content.strip()
        if stripped_content.startswith(("{", "[")):
            try:
                parsed_payload = json.loads(stripped_content)
            except json.JSONDecodeError:
                parsed_payload = None
            if parsed_payload is not None:
                return self._extract_tool_calls_from_payload(parsed_payload, id_prefix="content_tool_call")

        for index, raw_line in enumerate(content.splitlines(), start=1):
            line = raw_line.strip()
            if not line.startswith("{") or '"name"' not in line:
                continue
            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                continue
            extracted_calls.extend(self._extract_tool_calls_from_payload(payload, id_prefix=f"content_tool_call_{index}"))
        return extracted_calls

    def _extract_tool_calls_from_payload(self, payload: Any, *, id_prefix: str) -> list[ToolCall]:
        raw_calls = payload if isinstance(payload, list) else [payload]
        extracted_calls: list[ToolCall] = []
        for index, raw_call in enumerate(raw_calls, start=1):
            if not isinstance(raw_call, dict):
                continue

            function_payload = raw_call.get("function")
            if isinstance(function_payload, dict):
                name = function_payload.get("name")
                arguments = function_payload.get("arguments", function_payload.get("parameters"))
            else:
                name = raw_call.get("name")
                arguments = raw_call.get("arguments", raw_call.get("parameters"))

            if not isinstance(name, str) or not name.strip():
                continue
            if isinstance(arguments, str):
                try:
                    parsed_arguments = json.loads(arguments)
                except json.JSONDecodeError:
                    parsed_arguments = {}
                arguments = parsed_arguments
            if not isinstance(arguments, dict):
                arguments = {}

            extracted_calls.append(
                ToolCall(
                    id=str(raw_call.get("id") or f"{id_prefix}_{index}"),
                    name=name.strip(),
                    arguments=arguments,
                )
            )
        return extracted_calls

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
