"""Despacho de comandos. Sólo responde en el chat autorizado."""

from __future__ import annotations

import logging
from typing import Any, Callable

from . import reports
from .sources import Sources

log = logging.getLogger(__name__)

Report = Callable[[Sources], str]

COMMANDS: dict[str, Report] = {
    "/start": lambda _: reports.HELP_TEXT,
    "/ayuda": lambda _: reports.HELP_TEXT,
    "/help": lambda _: reports.HELP_TEXT,
    "/estado": reports.status_report,
    "/ram": reports.memory_report,
    "/red": reports.network_report,
    "/contenedores": lambda sources: reports.containers_report(*sources.containers()),
    "/alertas": lambda sources: reports.alerts_report(sources.active_alerts()),
}


def parse_command(text: str) -> str | None:
    """`/estado@AloVidaMonitorBot argumentos` → `/estado`."""
    if not text.startswith("/"):
        return None
    return text.split()[0].split("@", 1)[0].lower()


def reply_for(message: dict[str, Any], authorized_chat_id: int, sources: Sources) -> str | None:
    chat_id = (message.get("chat") or {}).get("id")
    command = parse_command(message.get("text") or "")
    if command is None:
        return None
    if chat_id != authorized_chat_id:
        log.warning("comando %s ignorado: viene de un chat no autorizado", command)
        return None
    report = COMMANDS.get(command)
    if report is None:
        return f"No conozco {command}. Probá /ayuda."
    try:
        return report(sources)
    except Exception as exc:  # noqa: BLE001 — el bot tiene que contestar algo aunque falle una fuente
        log.warning("falló %s: %s", command, exc)
        return f"⚠️ No pude armar {command}: {type(exc).__name__}. ¿Está arriba Prometheus?"
