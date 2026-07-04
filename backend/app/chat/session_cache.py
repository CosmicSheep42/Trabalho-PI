from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock
import time
from typing import Any


@dataclass
class SessionConversation:
    messages: list[dict[str, Any]] = field(default_factory=list)
    updated_at: float = field(default_factory=time.monotonic)


class SessionConversationCache:
    def __init__(self, *, ttl_seconds: int, max_messages: int) -> None:
        self.ttl_seconds = ttl_seconds
        self.max_messages = max_messages
        self._sessions: dict[str, SessionConversation] = {}
        self._lock = Lock()

    def get_messages(self, session_id: str) -> list[dict[str, Any]]:
        with self._lock:
            self._purge_expired_locked()
            session = self._sessions.get(session_id)
            if session is None:
                return []
            session.updated_at = time.monotonic()
            return [message.copy() for message in session.messages]

    def append_exchange(self, session_id: str, user_message: str, assistant_message: str) -> None:
        with self._lock:
            self._purge_expired_locked()
            session = self._sessions.setdefault(session_id, SessionConversation())
            session.messages.extend(
                [
                    {"role": "user", "content": user_message},
                    {"role": "assistant", "content": assistant_message},
                ]
            )
            session.messages = session.messages[-self.max_messages :]
            session.updated_at = time.monotonic()

    def clear(self, session_id: str) -> None:
        with self._lock:
            self._sessions.pop(session_id, None)

    def _purge_expired_locked(self) -> None:
        now = time.monotonic()
        expired = [
            session_id
            for session_id, session in self._sessions.items()
            if now - session.updated_at > self.ttl_seconds
        ]
        for session_id in expired:
            self._sessions.pop(session_id, None)
