"""Estado de cada contenedor según la API de Docker (vía el proxy de solo lectura).

cAdvisor da CPU, memoria y red, pero no el resultado del healthcheck, ni el
contador de reinicios, ni la política de reinicio. Eso sale de acá.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from .http_json import get_json

# Políticas con las que Docker promete mantener el contenedor vivo. Un
# contenedor con `restart: "no"` (los *-init, api-migrate) termina a propósito.
RESTARTING_POLICIES = frozenset({"always", "unless-stopped", "on-failure"})

# Un contenedor detenido hace más que esto es un resto de un despliegue viejo
# (Coolify deja los anteriores parados), no una caída: no se cuenta como tal.
STALE_AFTER = timedelta(hours=1)

# Etiquetas que Coolify y compose ponen, de la más legible a la menos.
RESOURCE_LABELS = ("coolify.resourceName", "coolify.name", "com.docker.compose.project")
SERVICE_LABEL = "com.docker.compose.service"

# `traefik.http.routers.<router>.rule` = "Host(`test.…`) && PathPrefix(`/`)".
_ROUTER_RULE = re.compile(r"^traefik\.http\.routers\.([^.]+)\.rule$")
_RULE_HOST = re.compile(r"Host\(`([^`]+)`\)")
_RULE_PATH = re.compile(r"PathPrefix\(`([^`]+)`\)")


@dataclass(frozen=True)
class ContainerState:
    name: str
    service: str
    resource: str
    status: str  # running · exited · restarting · paused · created · dead
    health: str  # healthy · unhealthy · starting · none
    restart_count: int
    oom_killed: bool
    restart_policy: str
    started_at: datetime | None
    finished_at: datetime | None = None
    # (router de Traefik, sitio legible): «https-0-<uuid>-proxy-4313» → «test.62….sslip.io».
    routes: tuple[tuple[str, str], ...] = ()

    @property
    def running(self) -> bool:
        return self.status == "running"

    @property
    def unhealthy(self) -> bool:
        # Sólo si corre: un contenedor detenido conserva su último health.
        return self.running and self.health == "unhealthy"

    def stale(self, now: datetime) -> bool:
        if self.running or self.finished_at is None:
            return False
        return now - self.finished_at > STALE_AFTER

    @property
    def expected_running(self) -> bool:
        return self.restart_policy in RESTARTING_POLICIES

    @property
    def display(self) -> str:
        if self.resource and self.service:
            return f"{self.resource}/{self.service}"
        return self.service or self.name


JsonGetter = Callable[[str], Any]


def fetch_container_states(docker_url: str, getter: JsonGetter | None = None) -> list[ContainerState]:
    get = getter or (lambda path: get_json(f"{docker_url}{path}"))
    summaries = get("/containers/json?all=1")
    return [parse_inspect(get(f"/containers/{summary['Id']}/json")) for summary in summaries]


def parse_inspect(inspect: dict[str, Any]) -> ContainerState:
    state = inspect.get("State") or {}
    labels = (inspect.get("Config") or {}).get("Labels") or {}
    health = (state.get("Health") or {}).get("Status") or "none"
    policy = ((inspect.get("HostConfig") or {}).get("RestartPolicy") or {}).get("Name") or "no"
    return ContainerState(
        name=str(inspect.get("Name", "")).lstrip("/"),
        service=labels.get(SERVICE_LABEL, ""),
        resource=_first_label(labels, RESOURCE_LABELS),
        status=state.get("Status", "unknown"),
        health=health,
        restart_count=int(inspect.get("RestartCount", 0) or 0),
        oom_killed=bool(state.get("OOMKilled", False)),
        restart_policy=policy,
        started_at=_parse_docker_time(state.get("StartedAt")),
        finished_at=_parse_docker_time(state.get("FinishedAt")),
        routes=parse_routes(labels),
    )


def parse_routes(labels: dict[str, str]) -> tuple[tuple[str, str], ...]:
    """Routers de Traefik declarados en las etiquetas, con el sitio que atienden.

    El sitio es el primer `Host` de la regla, más el `PathPrefix` si no es «/»
    (el servicio de IA atiende `/ai/` dentro de los dominios del front).
    """
    routes = []
    for key, rule in labels.items():
        match = _ROUTER_RULE.match(key)
        host = _RULE_HOST.search(rule or "")
        if not match or not host:
            continue
        path = _RULE_PATH.search(rule)
        suffix = path.group(1).rstrip("/") if path and path.group(1) != "/" else ""
        routes.append((match.group(1), host.group(1) + suffix))
    return tuple(sorted(routes))


def _first_label(labels: dict[str, str], keys: tuple[str, ...]) -> str:
    for key in keys:
        value = labels.get(key)
        if value:
            return value
    return ""


def _parse_docker_time(raw: str | None) -> datetime | None:
    # Docker devuelve nanosegundos ("2026-10-04T03:45:41.123456789Z") y
    # "0001-01-01T00:00:00Z" si nunca arrancó. fromisoformat acepta hasta µs.
    if not raw or raw.startswith("0001-"):
        return None
    head, _, frac = raw.rstrip("Z").partition(".")
    try:
        parsed = datetime.fromisoformat(f"{head}.{frac[:6]}" if frac else head)
    except ValueError:
        return None
    return parsed.replace(tzinfo=timezone.utc)
