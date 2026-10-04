"""Cliente mínimo de la Bot API de Telegram: long polling y envío de mensajes."""

from __future__ import annotations

from typing import Any, Callable

from .http_json import post_json

API_BASE = "https://api.telegram.org"
LONG_POLL_SECONDS = 50
MAX_MESSAGE_CHARS = 4000  # Telegram corta en 4096; se deja margen para el HTML

Poster = Callable[[str, dict[str, Any], float], Any]


class TelegramClient:
    def __init__(self, token: str, poster: Poster | None = None):
        self._base = f"{API_BASE}/bot{token}"
        self._post = poster or (lambda url, payload, timeout: post_json(url, payload, timeout))

    def get_updates(self, offset: int | None) -> list[dict[str, Any]]:
        payload: dict[str, Any] = {"timeout": LONG_POLL_SECONDS, "allowed_updates": ["message"]}
        if offset is not None:
            payload["offset"] = offset
        response = self._post(f"{self._base}/getUpdates", payload, LONG_POLL_SECONDS + 10)
        return response.get("result", []) if response.get("ok") else []

    def send_message(self, chat_id: int, text: str) -> None:
        for chunk in split_message(text):
            self._post(
                f"{self._base}/sendMessage",
                {"chat_id": chat_id, "text": chunk, "parse_mode": "HTML", "disable_web_page_preview": True},
                15,
            )


def split_message(text: str, limit: int = MAX_MESSAGE_CHARS) -> list[str]:
    """Parte por líneas para no cortar una etiqueta HTML a la mitad."""
    chunks: list[str] = []
    current = ""
    for line in text.split("\n"):
        candidate = f"{current}\n{line}" if current else line
        if len(candidate) <= limit:
            current = candidate
            continue
        if current:
            chunks.append(current)
        current = line[:limit]
    if current:
        chunks.append(current)
    return chunks or [""]
