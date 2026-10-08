"""Despacho de comandos. Sólo responde en el chat autorizado."""

from __future__ import annotations

import logging
from typing import Any, Callable

from . import extra_reports, history, reports
from .sources import Sources

log = logging.getLogger(__name__)

Reply = str | list[reports.Photo]
Report = Callable[[Sources], Reply]

_HELP: Report = lambda _: reports.HELP_TEXT
_CONTAINERS: Report = lambda sources: reports.containers_report(*sources.containers())
_ALERTS: Report = lambda sources: reports.alerts_report(sources.active_alerts())

# Cada comando en castellano y en inglés: /status y /estado dan lo mismo.
COMMANDS: dict[str, Report] = {
    "/start": _HELP,
    "/ayuda": _HELP,
    "/help": _HELP,
    "/status": reports.status_report,
    "/estado": reports.status_report,
    "/ram": reports.memory_report,
    "/memory": reports.memory_report,
    "/cpu": reports.cpu_report,
    "/graficas": history.resource_charts,
    "/gráficas": history.resource_charts,
    "/charts": history.resource_charts,
    "/disco": extra_reports.disk_report,
    "/disk": extra_reports.disk_report,
    "/top": extra_reports.top_report,
    "/sitios": extra_reports.sites_report,
    "/sites": extra_reports.sites_report,
    "/uptime": extra_reports.uptime_report,
    "/red": reports.network_report,
    "/network": reports.network_report,
    "/contenedores": _CONTAINERS,
    "/containers": _CONTAINERS,
    "/alertas": _ALERTS,
    "/alerts": _ALERTS,
}

# Lo que Telegram muestra en el menú al tocar «/» (setMyCommands).
MENU: list[tuple[str, str]] = [
    ("status", "Resumen: RAM, CPU, disco, red, contenedores y alertas"),
    ("graficas", "Gráficas 24 h: RAM, CPU, disco, red y contenedores"),
    ("ram", "RAM del servidor y contenedores que más usan"),
    ("cpu", "Uso por núcleo, carga y contenedores que más CPU usan"),
    ("disco", "Espacio por disco y cuánto creció en 24 h"),
    ("red", "Tráfico de red por interfaz y contenedor"),
    ("top", "Los 10 contenedores que más CPU y RAM usan"),
    ("sitios", "Estado, latencia y certificado de cada sitio"),
    ("contenedores", "Estado y salud de cada contenedor"),
    ("alertas", "Alertas activas"),
    ("uptime", "Hace cuánto está encendido el servidor y su carga"),
    ("ayuda", "Lista de comandos"),
]


def parse_command(text: str) -> str | None:
    """`/estado@AloVidaMonitorBot argumentos` → `/estado`."""
    if not text.startswith("/"):
        return None
    return text.split()[0].split("@", 1)[0].lower()


def reply_for(message: dict[str, Any], authorized_chat_id: int, sources: Sources) -> Reply | None:
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
