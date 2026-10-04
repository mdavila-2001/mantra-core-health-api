"""Lecturas que alimentan los comandos: Prometheus, Alertmanager y Docker."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Protocol

from .docker_state import ContainerState
from .http_json import get_json

Sample = tuple[dict[str, str], float]


class Sources(Protocol):
    def query(self, expr: str) -> list[Sample]: ...
    def active_alerts(self) -> list[dict[str, Any]]: ...
    def containers(self) -> tuple[list[ContainerState], bool]: ...


@dataclass
class LiveSources:
    prometheus_url: str
    alertmanager_url: str
    containers_provider: Callable[[], tuple[list[ContainerState], bool]]

    def query(self, expr: str) -> list[Sample]:
        payload = get_json(f"{self.prometheus_url}/api/v1/query", {"query": expr})
        if payload.get("status") != "success":
            raise RuntimeError(f"Prometheus rechazó la consulta: {payload.get('error', '?')}")
        return [(item["metric"], float(item["value"][1])) for item in payload["data"]["result"]]

    def active_alerts(self) -> list[dict[str, Any]]:
        params = {"active": "true", "silenced": "false", "inhibited": "false"}
        alerts = get_json(f"{self.alertmanager_url}/api/v2/alerts", params)
        return [alert for alert in alerts if alert["labels"].get("alertname") != "Watchdog"]

    def containers(self) -> tuple[list[ContainerState], bool]:
        return self.containers_provider()
