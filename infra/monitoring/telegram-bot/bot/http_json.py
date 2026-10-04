"""GET/POST de JSON con la biblioteca estándar y timeout siempre explícito."""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from typing import Any

DEFAULT_TIMEOUT_SECONDS = 10


class HttpError(RuntimeError):
    """La petición no llegó o devolvió algo que no es JSON."""


def get_json(url: str, params: dict[str, str] | None = None, timeout: float = DEFAULT_TIMEOUT_SECONDS) -> Any:
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    return _send(urllib.request.Request(url, method="GET"), timeout)


def post_json(url: str, payload: dict[str, Any], timeout: float = DEFAULT_TIMEOUT_SECONDS) -> Any:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url, data=body, method="POST", headers={"Content-Type": "application/json"}
    )
    return _send(request, timeout)


def _send(request: urllib.request.Request, timeout: float) -> Any:
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except (OSError, ValueError) as exc:
        # El mensaje NO incluye la URL: la de Telegram lleva el token adentro.
        raise HttpError(f"{request.get_method()} falló: {type(exc).__name__}") from exc
