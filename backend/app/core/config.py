from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


def _load_env() -> None:
    current_file = Path(__file__).resolve()
    candidates = [
        current_file.parents[3] / ".env",
        current_file.parents[2] / ".env",
    ]

    for env_path in candidates:
        if env_path.exists():
            load_dotenv(env_path, override=False)
            break


_load_env()


class Settings:
    app_name = "API"
    app_version = "1.0.0"
    api_prefix = "/api"
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    api_url = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8000")
    clerk_secret_key = os.getenv("CLERK_SECRET_KEY", "")
    clerk_jwt_key = os.getenv("CLERK_JWT_KEY", "")

    mysql_host = os.getenv("MYSQL_HOST", "mysql")
    mysql_port = int(os.getenv("MYSQL_PORT", "3306"))
    mysql_database = os.getenv("MYSQL_DATABASE", "")
    mysql_user = os.getenv("MYSQL_USER", "")
    mysql_password = os.getenv("MYSQL_PASSWORD", "")
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    generation_model = os.getenv("GENERATION_MODEL", "llama3.2:3b")
    generation_temperature = float(os.getenv("GENERATION_TEMPERATURE", "0.55"))
    tool_calling_enabled = os.getenv("TOOL_CALLING_ENABLED", "true").strip().lower() in {"1", "true", "yes", "on"}
    tool_calling_model = os.getenv("TOOL_CALLING_MODEL", generation_model)
    tool_calling_max_rounds = int(os.getenv("TOOL_CALLING_MAX_ROUNDS", "2"))
    cleaner_remove_emojis = os.getenv("CLEANER_REMOVE_EMOJIS", "true").strip().lower() in {"1", "true", "yes", "on"}
    cleaner_expand_abbreviations = os.getenv("CLEANER_EXPAND_ABBREVIATIONS", "true").strip().lower() in {"1", "true", "yes", "on"}
    cleaner_normalize_unicode = os.getenv("CLEANER_NORMALIZE_UNICODE", "true").strip().lower() in {"1", "true", "yes", "on"}
    cleaner_remove_extra_spaces = os.getenv("CLEANER_REMOVE_EXTRA_SPACES", "true").strip().lower() in {"1", "true", "yes", "on"}
    cleaner_lowercase = os.getenv("CLEANER_LOWERCASE", "true").strip().lower() in {"1", "true", "yes", "on"}
    max_input_chars = int(os.getenv("MAX_INPUT_CHARS", "1000"))
    rate_limit_requests = int(os.getenv("RATE_LIMIT_REQUESTS", "20"))
    rate_limit_window_seconds = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
    inference_timeout_seconds = float(os.getenv("INFERENCE_TIMEOUT_SECONDS", "120"))
    chat_session_ttl_seconds = int(os.getenv("CHAT_SESSION_TTL_SECONDS", "1800"))
    chat_session_message_limit = int(os.getenv("CHAT_SESSION_MESSAGE_LIMIT", "20"))

    @property
    def frontend_urls(self) -> list[str]:
        raw_value = os.getenv("FRONTEND_URLS", "")
        urls = [value.strip() for value in raw_value.split(",") if value.strip()]
        if self.frontend_url and self.frontend_url not in urls:
            urls.append(self.frontend_url)
        return urls or ["http://localhost:3000"]

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
        )

    def input_cleaner_config(self) -> dict[str, object]:
        return {
            "preprocessor_config": {
                "remove_emojis": self.cleaner_remove_emojis,
                "expand_abbreviations": self.cleaner_expand_abbreviations,
                "normalize_unicode": self.cleaner_normalize_unicode,
                "remove_extra_spaces": self.cleaner_remove_extra_spaces,
                "lowercase": self.cleaner_lowercase,
            },
        }


settings = Settings()
