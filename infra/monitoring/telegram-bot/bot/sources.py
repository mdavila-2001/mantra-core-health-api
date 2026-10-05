"""Lecturas que alimentan los comandos: Prometheus, Alertmanager y Docker."""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Callable, Protocol

from .docker_state import ContainerState
from .http_json import get_json

Sample = tuple[dict[str, str], float]
Point = tuple[float, float]

DAY_SECONDS = 24 * 3600
RANGE_STEP_SECONDS = 300  # un punto cada 5 min: 288 puntos en 24 h


class Sources(Protocol):
    timezone: str

    def query(self, expr: str) -> list[Sample]: ...
    def query_range(self, expr: str) -> list[Point]: ...
    def query_range(self, expr: str) -> list[Point]:
        """Últimas 24 h de la PRIMERA serie del resultado (las consultas suman a una)."""
        end = time.time()
        params = {"query": expr, "start": str(end - DAY_SECONDS), "end": str(end), "step": str(RANGE_STEP_SECONDS)}
        payload = get_json(f"{self.prometheus_url}/api/v1/query_range", params)
        if payload.get("status") != "success":
            raise RuntimeError(f"Prometheus rechazó la consulta: {payload.get('error', '?')}")
        result = payload["data"]["result"]
        return [(float(ts), float(value)) for ts, value in result[0]["values"]] if result else []

    def active_alerts(self) -> list[dict[str, Any]]: ...
    def containers(self) -> tuple[list[ContainerState], bool]: ...


@dataclass
class LiveSources:
    prometheus_url: str
    alertmanager_url: str
    containers_provider: Callable[[], tuple[list[ContainerState], bool]]
    timezone: str = "America/La_Paz"

    def query(self, expr: str) -> list[Sample]:
        payload = get_json(f"{self.prometheus_url}/api/v1/query", {"query": expr})
        if payload.get("status") != "success":
            raise RuntimeError(f"Prometheus rechazó la consulta: {payload.get('error', '?')}")
        return [(item["metric"], float(item["value"][1])) for item in payload["data"]["result"]]

    def query_range(self, expr: str) -> list[Point]:
        """Últimas 24 h de la PRIMERA serie del resultado (las consultas suman a una)."""
        end = time.time()
        params = {"query": expr, "start": str(end - DAY_SECONDS), "end": str(end), "step": str(RANGE_STEP_SECONDS)}
        payload = get_json(f"{self.prometheus_url}/api/v1/query_range", params)
        if payload.get("status") != "success":
            raise RuntimeError(f"Prometheus rechazó la consulta: {payload.get('error', '?')}")
        result = payload["data"]["result"]
        return [(float(ts), float(value)) for ts, value in result[0]["values"]] if result else []

    def active_alerts(self) -> list[dict[str, Any]]:
        params = {"active": "true", "silenced": "false", "inhibited": "false"}
        alerts = get_json(f"{self.alertmanager_url}/api/v2/alerts", params)
        return [alert for alert in alerts if alert["labels"].get("alertname") != "Watchdog"]

    def containers(self) -> tuple[list[ContainerState], bool]:
        return self.containers_provider()
