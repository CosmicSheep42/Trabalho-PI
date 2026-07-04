from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
import threading
import time


@dataclass(frozen=True)
class RuntimeControlConfig:
    max_input_chars: int
    rate_limit_requests: int
    rate_limit_window_seconds: int
    inference_timeout_seconds: float


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, client_id: str) -> tuple[bool, float]:
        now = time.monotonic()
        with self._lock:
            timestamps = self._requests[client_id]
            while timestamps and now - timestamps[0] > self.window_seconds:
                timestamps.popleft()

            if len(timestamps) >= self.max_requests:
                retry_after = self.window_seconds - (now - timestamps[0])
                return False, max(retry_after, 0.0)

            timestamps.append(now)
            return True, 0.0


class RuntimeControls:
    def __init__(self, config: RuntimeControlConfig) -> None:
        self.config = config
        self.rate_limiter = RateLimiter(
            max_requests=config.rate_limit_requests,
            window_seconds=config.rate_limit_window_seconds,
        )

    def validate_input(self, text: str) -> tuple[bool, str | None]:
        if not text or not text.strip():
            return False, "Message cannot be empty."
        if len(text) > self.config.max_input_chars:
            return False, f"Message exceeds the maximum size of {self.config.max_input_chars} characters."
        return True, None

    def allow_request(self, session_id: str) -> tuple[bool, float]:
        return self.rate_limiter.allow(session_id)
