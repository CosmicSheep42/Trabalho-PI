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

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
        )


settings = Settings()
