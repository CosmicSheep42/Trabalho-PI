from __future__ import annotations

import re


USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_-]{5,50}$")
USERNAME_VALIDATION_MESSAGE = (
    "Username must be unique, contain 5 to 50 characters, and use only letters, numbers, hyphens, or underscores"
)


def normalize_username(value: str) -> str:
    normalized = value.strip()
    if not USERNAME_PATTERN.fullmatch(normalized):
        raise ValueError(USERNAME_VALIDATION_MESSAGE)
    return normalized
