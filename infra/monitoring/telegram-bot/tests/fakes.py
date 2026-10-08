from __future__ import annotations

from datetime import datetime, timezone

from bot.docker_state import ContainerState
from bot import reports

GIB = 1024**3


def container(**overrides) -> ContainerState:
    base = dict(
        name="api-abc-1",
        service="api",
        resource="alovida-backend-central",
        status="running",
        health="healthy",
        restart_count=0,
        oom_killed=False,
        restart_policy="always",
        started_at=datetime(2026, 10, 4, 0, 0, tzinfo=timezone.utc),
    )
    base.update(overrides)
    return ContainerState(**base)


class FakeSources:
    timezone = "America/La_Paz"

    def __init__(self, samples=None, alerts=None, states=None, docker_up=True, ranges=None):
        self.samples = samples or {}
        self.ranges = ranges or {}
        self.alerts = alerts or []
        self.states = states if states is not None else [container()]
        self.docker_up = docker_up
        self.queries: list[str] = []

    def query(self, expr):
        self.queries.append(expr)
        return self.samples.get(expr, [])

    def query_range(self, expr):
        return self.ranges.get(expr, [])

    def query_range_series(self, expr):
        points = self.ranges.get(expr)
        return [({}, points)] if points else []

    def active_alerts(self):
        return self.alerts

    def containers(self):
        return self.states, self.docker_up


def host_samples() -> dict:
    return {
        reports.Q_MEM_TOTAL: [({}, 48 * GIB)],
        reports.Q_MEM_AVAILABLE: [({}, 36 * GIB)],
        reports.Q_SWAP_TOTAL: [({}, 4 * GIB)],
        reports.Q_SWAP_FREE: [({}, 3 * GIB)],
        reports.Q_DISK_ROOT_USED: [({"mountpoint": "/"}, 0.42)],
        reports.Q_LOAD_PER_CORE: [({}, 0.31)],
        reports.Q_NET_RX: [({"device": "eth0"}, 12_500_000.0)],
        reports.Q_NET_TX: [({"device": "eth0"}, 3_000_000.0)],
    }
