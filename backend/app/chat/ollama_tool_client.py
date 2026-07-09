from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from urllib import error, request


@dataclass(frozen=True)
class ToolSpec:
    name: str
    description: str
    parameters: dict[str, Any]


@dataclass(frozen=True)
class ToolCall:
    id: str
    name: str
    arguments: dict[str, Any]


@dataclass(frozen=True)
class ChatResult:
    content: str
    tool_calls: list[ToolCall]


class OllamaToolCallingClient:
    def __init__(
        self,
        *,
        base_url: str,
        default_model: str,
        temperature: float,
        num_predict: int = 2048,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model
        self.temperature = temperature
        self.num_predict = num_predict

    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[ToolSpec] | None = None,
        *,
        model: str | None = None,
        num_predict: int | None = None,
    ) -> ChatResult:
        payload: dict[str, Any] = {
            "model": model or self.default_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": self.temperature,
                "num_predict": num_predict if num_predict is not None else self.num_predict,
            },
        }
        if tools:
            payload["tools"] = [self._serialize_tool(tool) for tool in tools]

        body = json.dumps(payload).encode("utf-8")
        chat_request = request.Request(
            url=f"{self.base_url}/api/chat",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with request.urlopen(chat_request) as response:
                raw = response.read().decode("utf-8")
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Ollama chat request failed with status {exc.code}: {detail}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"Could not reach Ollama at {self.base_url}: {exc.reason}") from exc

        data = json.loads(raw)
        message = data.get("message") or {}
        content = str(message.get("content") or "").strip()
        tool_calls = self._parse_tool_calls(message.get("tool_calls"))
        return ChatResult(content=content, tool_calls=tool_calls)

    def _serialize_tool(self, tool: ToolSpec) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.parameters,
            },
        }

    def _parse_tool_calls(self, raw_tool_calls: Any) -> list[ToolCall]:
        if not isinstance(raw_tool_calls, list):
            return []

        parsed_calls: list[ToolCall] = []
        for index, raw_call in enumerate(raw_tool_calls, start=1):
            if not isinstance(raw_call, dict):
                continue

            function_payload = raw_call.get("function")
            if isinstance(function_payload, dict):
                name = str(function_payload.get("name") or "").strip()
                arguments = function_payload.get("arguments")
            else:
                name = str(raw_call.get("name") or "").strip()
                arguments = raw_call.get("arguments")

            if not name:
                continue

            call_id = str(raw_call.get("id") or f"tool_call_{index}")
            parsed_calls.append(
                ToolCall(
                    id=call_id,
                    name=name,
                    arguments=self._coerce_arguments(arguments),
                )
            )
        return parsed_calls

    def _coerce_arguments(self, arguments: Any) -> dict[str, Any]:
        if isinstance(arguments, dict):
            return arguments
        if isinstance(arguments, str):
            stripped = arguments.strip()
            if not stripped:
                return {}
            try:
                parsed = json.loads(stripped)
            except json.JSONDecodeError:
                return {"raw_arguments": stripped}
            if isinstance(parsed, dict):
                return parsed
        return {}
