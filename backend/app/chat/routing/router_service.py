from __future__ import annotations

from difflib import SequenceMatcher
from hashlib import sha1
from pathlib import Path
from typing import Any

from app.chat.input_cleaner import TextPreprocessorPipeline
from app.chat.routing.routing_config_loader import RoutingConfigLoader
from app.chat.routing.routing_order_resolver import RoutingOrderResolver


class StaticRouter:
    def __init__(
        self,
        *,
        routing_dir: Path,
        input_pipeline: TextPreprocessorPipeline,
    ) -> None:
        self.config_loader = RoutingConfigLoader(routing_dir=routing_dir)
        self.order_resolver = RoutingOrderResolver()
        self.input_pipeline = input_pipeline
        self.configs: dict[str, dict[str, Any]] = {}
        self.ordered_categories: list[str] = []
        self.ready = False

    def setup(self) -> bool:
        catalog = self.config_loader.load()
        self.configs = catalog.configs
        self.ordered_categories = self.order_resolver.resolve(
            self.configs,
            catalog.priority_overrides,
        )
        self.ready = True
        return True

    def route(self, query: str, already_cleaned: bool = False) -> dict[str, Any]:
        if not self.ready:
            raise RuntimeError("Router not initialized. Call setup() first.")

        cleaned_query = query if already_cleaned else self.input_pipeline.process_for_routing(query)
        if not cleaned_query:
            return {
                "route": "llm",
                "reason": "empty_after_preprocessing",
                "matched_category": None,
                "matched_intent": None,
                "score": None,
            }

        for category in self.ordered_categories:
            intent_match = self._best_match(category, cleaned_query)
            if not intent_match:
                continue

            threshold = float(self.configs.get(category, {}).get("threshold", 0.80))
            if intent_match["score"] >= threshold:
                return self._build_static_response(category, cleaned_query, intent_match)

        return {
            "route": "llm",
            "reason": "no_static_route_match",
            "matched_category": None,
            "matched_intent": None,
            "score": None,
        }

    def _best_match(self, category: str, query: str) -> dict[str, Any] | None:
        best_match: dict[str, Any] | None = None
        for intent in self.configs.get(category, {}).get("intents", []):
            for example in intent.get("examples", []):
                example_text = self.input_pipeline.process_for_routing(str(example))
                score = self._score_texts(query, example_text)
                if best_match is None or score > best_match["score"]:
                    best_match = {
                        "intent_key": intent["key"],
                        "score": score,
                    }
        return best_match

    def _score_texts(self, left: str, right: str) -> float:
        if not left or not right:
            return 0.0
        if left == right:
            return 1.0
        if left in right or right in left:
            return 0.92

        left_tokens = set(left.split())
        right_tokens = set(right.split())
        overlap = 0.0
        if left_tokens and right_tokens:
            overlap = len(left_tokens & right_tokens) / len(left_tokens | right_tokens)

        sequence_score = SequenceMatcher(None, left, right).ratio()
        return max(overlap, sequence_score)

    def _pick_variant(self, query: str, variants: list[str], salt: str) -> str:
        if not variants:
            return ""

        seed = f"{salt}:{query.strip().lower()}".encode("utf-8")
        digest = sha1(seed).digest()
        index = digest[0] % len(variants)
        return variants[index]

    def _build_static_response(self, category: str, query: str, match: dict[str, Any]) -> dict[str, Any]:
        intent = self._get_intent(category, match["intent_key"])
        variants = self._get_static_variants(intent)
        response = self._pick_variant(query, variants, f"{category}:{intent['key']}")

        return {
            "route": "static",
            "reason": "matched_static_intent",
            "matched_category": category,
            "matched_intent": intent["key"],
            "score": match["score"],
            "result": response,
        }

    def _get_static_variants(self, intent: dict[str, Any]) -> list[str]:
        for key in ("responses", "warnings", "answers", "replies", "messages"):
            variants = intent.get(key, [])
            if isinstance(variants, list) and variants:
                return [str(variant) for variant in variants if str(variant).strip()]
        return []

    def _get_intent(self, category: str, intent_key: str) -> dict[str, Any]:
        config = self.configs.get(category, {})
        for intent in config.get("intents", []):
            if intent.get("key") == intent_key:
                return intent
        raise KeyError(f"Intent not found in category '{category}': {intent_key}")
