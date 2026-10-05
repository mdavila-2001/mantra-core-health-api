"""Cliente mínimo de la Bot API de Telegram: long polling y envío de mensajes."""

from __future__ import annotations

import json
import urllib.request
import uuid
from typing import Any, Callable

from .http_json import HttpError, post_json

API_BASE = "https://api.telegram.org"
LONG_POLL_SECONDS = 50
MAX_MESSAGE_CHARS = 4000  # Telegram corta en 4096; se deja margen para el HTML

Poster = Callable[[str, dict[str, Any], float], Any]
Uploader = Callable[[str, bytes, str, float], Any]


class TelegramClient:
    def __init__(self, token: str, poster: Poster | None = None, uploader: Uploader | None = None):
        self._base = f"{API_BASE}/bot{token}"
        self._post = poster or (lambda url, payload, timeout: post_json(url, payload, timeout))
        self._upload = uploader or _upload_multipart

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


    def send_photo(self, chat_id: int, png: bytes, caption: str) -> None:
        fields = {"chat_id": str(chat_id), "caption": caption[:1024]}
        body, content_type = encode_multipart(fields, "photo", "grafica.png", png)
        self._upload(f"{self._base}/sendPhoto", body, content_type, 30)

    def set_commands(self, commands: list[tuple[str, str]]) -> None:
        self._post(
            f"{self._base}/setMyCommands",
            {"commands": [{"command": name, "description": text} for name, text in commands]},
            15,
        )


def encode_multipart(fields: dict[str, str], file_field: str, filename: str, content: bytes) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    parts: list[bytes] = []
    for name, value in fields.items():
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode("utf-8")
        )
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="{file_field}"; filename="{filename}"\r\n'
        "Content-Type: image/png\r\n\r\n".encode("utf-8")
    )
    parts.append(content)
    parts.append(f"\r\n--{boundary}--\r\n".encode("utf-8"))
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


def _upload_multipart(url: str, body: bytes, content_type: str, timeout: float) -> Any:
    request = urllib.request.Request(url, data=body, method="POST", headers={"Content-Type": content_type})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except (OSError, ValueError) as exc:
        # Sin la URL en el mensaje: lleva el token.
        raise HttpError(f"POST falló: {type(exc).__name__}") from exc


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
