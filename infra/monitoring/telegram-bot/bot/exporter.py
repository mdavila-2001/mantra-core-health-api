"""/metrics en formato de exposición de Prometheus, más /health para Docker."""

from __future__ import annotations

import logging
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Callable

from .docker_state import ContainerState

log = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 15


class DockerStateCache:
    """Comparte una sola consulta a Docker entre el scrape y los comandos."""

    def __init__(self, fetch: Callable[[], list[ContainerState]], clock: Callable[[], float] = time.monotonic):
        self._fetch = fetch
        self._clock = clock
        self._lock = threading.Lock()
        self._states: list[ContainerState] = []
        self._fetched_at: float | None = None
        self._last_ok = False

    def get(self) -> tuple[list[ContainerState], bool]:
        with self._lock:
            fresh = self._fetched_at is not None and self._clock() - self._fetched_at < CACHE_TTL_SECONDS
            if not fresh:
                self._refresh()
            return list(self._states), self._last_ok

    def _refresh(self) -> None:
        try:
            self._states = self._fetch()
            self._last_ok = True
        except Exception as exc:  # noqa: BLE001 — cualquier fallo de Docker se expone como alovida_docker_up 0
            log.warning("no se pudo leer el estado de Docker: %s", exc)
            self._last_ok = False
        self._fetched_at = self._clock()


_METRICS = (
    ("alovida_container_running", "1 si el contenedor está corriendo.", lambda c: int(c.running)),
    ("alovida_container_unhealthy", "1 si su healthcheck está fallando.", lambda c: int(c.unhealthy)),
    ("alovida_container_expected_running", "1 si su política de reinicio promete mantenerlo vivo.", lambda c: int(c.expected_running)),
    ("alovida_container_restart_count", "Reinicios hechos por Docker desde que se creó el contenedor.", lambda c: c.restart_count),
    ("alovida_container_oom_killed", "1 si la última vez murió por falta de memoria.", lambda c: int(c.oom_killed)),
    # RestartCount sólo cuenta los reinicios de la política de Docker; los que
    # hace autoheal por la API lo dejan en 0 (medido). Un cambio de StartedAt
    # sí captura los dos: es la base de la alerta ContainerRestartLoop.
    ("alovida_container_started_at_seconds", "Unix time del último arranque (0 si nunca arrancó).", lambda c: _epoch(c.started_at)),
)


def render_metrics(states: list[ContainerState], docker_up: bool) -> str:
    lines = [
        "# HELP alovida_docker_up 1 si la API de Docker respondió.",
        "# TYPE alovida_docker_up gauge",
        f"alovida_docker_up {int(docker_up)}",
    ]
    for metric, help_text, value_of in _METRICS:
        lines.append(f"# HELP {metric} {help_text}")
        lines.append(f"# TYPE {metric} gauge")
        lines.extend(f"{metric}{{{_labels(state)}}} {value_of(state)}" for state in states)
    lines.extend(_router_info(states))
    return "\n".join(lines) + "\n"


def _router_info(states: list[ContainerState]) -> list[str]:
    # Traefik nombra los routers con el uuid de Coolify («…@docker»); esta serie
    # le pone el dominio para que las alertas y el bot digan «test.…», no el uuid.
    # Sólo los que corren: un despliegue viejo detenido declara el mismo router.
    routes = sorted({route for state in states if state.running for route in state.routes})
    lines = [
        "# HELP alovida_router_info Sitio que atiende cada router de Traefik (siempre 1).",
        "# TYPE alovida_router_info gauge",
    ]
    lines.extend(
        f'alovida_router_info{{router="{_escape(router)}@docker",site="{_escape(site)}"}} 1' for router, site in routes
    )
    return lines


def _epoch(moment) -> int:
    return int(moment.timestamp()) if moment else 0


def _labels(state: ContainerState) -> str:
    pairs = {
        "name": state.name,
        "service": state.service,
        "resource": state.resource,
        "display": state.display,
    }
    return ",".join(f'{key}="{_escape(value)}"' for key, value in pairs.items())


def _escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("\n", "\\n").replace('"', '\\"')


def serve_exporter(port: int, cache: DockerStateCache) -> ThreadingHTTPServer:
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802 — nombre impuesto por http.server
            if self.path == "/health":
                self._reply(200, "text/plain", "ok\n")
            elif self.path == "/metrics":
                states, docker_up = cache.get()
                self._reply(200, "text/plain; version=0.0.4", render_metrics(states, docker_up))
            else:
                self._reply(404, "text/plain", "no existe\n")

        def _reply(self, status: int, content_type: str, body: str) -> None:
            payload = body.encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def log_message(self, *_: object) -> None:
            return  # sin una línea de log por cada scrape de 30 s

    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    threading.Thread(target=server.serve_forever, name="exporter", daemon=True).start()
    return server
