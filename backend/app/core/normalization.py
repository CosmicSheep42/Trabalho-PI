from __future__ import annotations


def normalize_item_name(value: str) -> str:
    return " ".join(value.split()).casefold()
