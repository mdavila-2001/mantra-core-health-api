"""Vigilantes que avisan al chat sin que nadie pregunte.

- Seguridad: logins por SSH, IPs bloqueadas por fail2ban y puertos nuevos que
  un contenedor publica a internet (Docker se saltea el firewall).
- Despliegues: contenedores que arrancan (agrupados por despliegue), que mueren
  con error o por falta de memoria.
- Recursos: cuando Alertmanager dispara una alerta de RAM/CPU/disco/red, se
  manda la gráfica de 24 h de ese recurso para ver la tendencia.

Las funciones de análisis son puras (se prueban sin red); los bucles sólo leen
y llaman a `notify`.
"""

from __future__ import annotations

import html
import json
import logging
import os
import re
import threading
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from typing import Callable

from .http_json import get_json

log = logging.getLogger(__name__)

Notify = Callable[[str], None]

LOGIN_REPEAT_SECONDS = 3600
DEPLOY_WINDOW_SECONDS = 90
NORMAL_EXIT_CODES = {0, 137, 143}  # 137/143 = parada pedida (SIGKILL/SIGTERM)

_ACCEPTED = re.compile(r"sshd\[\d+\]: Accepted (\w+) for (\S+) from (\S+)")
_BANNED = re.compile(r"\[([\w-]+)\] Ban (\S+)")


def _e(text: str) -> str:
    return html.escape(text, quote=False)


# --- archivos de log -------------------------------------------------------


class LogTail:
    """Lee las líneas nuevas de un log, sobreviviendo a la rotación."""

    def __init__(self, path: str):
        self.path = path
        self._inode: int | None = None
        self._offset = 0
        self._prime()

    def _prime(self) -> None:
        # Arranca al final: no se reenvía la historia vieja al reiniciar el bot.
        try:
            stat = os.stat(self.path)
            self._inode, self._offset = stat.st_ino, stat.st_size
        except OSError:
            self._inode, self._offset = None, 0

    def read_new_lines(self) -> list[str]:
        try:
            stat = os.stat(self.path)
        except OSError:
            return []
        if stat.st_ino != self._inode or stat.st_size < self._offset:
            self._inode, self._offset = stat.st_ino, 0  # rotó: archivo nuevo
        with open(self.path, encoding="utf-8", errors="replace") as handle:
            handle.seek(self._offset)
            data = handle.read()
            self._offset = handle.tell()
        return data.splitlines()


@dataclass
class SecurityParser:
    known_ips: frozenset[str] = frozenset()
    _last_login: dict[tuple[str, str], float] = field(default_factory=dict)

    def auth_line(self, line: str, now: float) -> str | None:
        match = _ACCEPTED.search(line)
        if not match:
            return None
        method, user, ip = match.groups()
        key = (user, ip)
        last = self._last_login.get(key)
        if last is not None and now - last < LOGIN_REPEAT_SECONDS:
            return None
        self._last_login[key] = now
        who = " (IP conocida del equipo)" if ip in self.known_ips else " — <b>IP desconocida</b>"
        if method == "password":
            return f"⚠️🔐 Login SSH <b>con contraseña</b>: {_e(user)} desde {_e(ip)}{who}"
        return f"🔐 Login SSH: {_e(user)} desde {_e(ip)}{who}"

    @staticmethod
    def fail2ban_line(line: str) -> str | None:
        match = _BANNED.search(line)
        if not match:
            return None
        jail, ip = match.groups()
        return f"🚫 fail2ban bloqueó {_e(ip)} (regla {_e(jail)}) por intentos fallidos"


def public_ports(containers: list[dict]) -> dict[tuple[int, str], str]:
    """{(puerto, protocolo): contenedor} de lo publicado en todas las interfaces."""
    found: dict[tuple[int, str], str] = {}
    for container in containers:
        name = (container.get("Names") or ["?"])[0].lstrip("/")
        for port in container.get("Ports") or []:
            if port.get("PublicPort") and port.get("IP") in ("0.0.0.0", "::", None, ""):
                found[(int(port["PublicPort"]), port.get("Type", "tcp"))] = name
    return found


def diff_ports(before: dict, after: dict) -> list[str]:
    messages = []
    for key in sorted(set(after) - set(before)):
        port, proto = key
        messages.append(f"🔓 Puerto NUEVO abierto a internet: {port}/{proto} por {_e(after[key])}")
    for key in sorted(set(before) - set(after)):
        port, proto = key
        messages.append(f"🔒 Puerto cerrado: {port}/{proto} (era de {_e(before[key])})")
    return messages


# --- eventos de Docker -----------------------------------------------------


@dataclass
class DeployAggregator:
    """Junta los arranques de un mismo despliegue en un solo aviso."""

    window: float = DEPLOY_WINDOW_SECONDS
    _pending: dict[str, tuple[float, set[str]]] = field(default_factory=dict)
    _stopping: set[str] = field(default_factory=set)

    def event(self, event: dict, now: float) -> str | None:
        action = event.get("Action") or event.get("status") or ""
        attrs = (event.get("Actor") or {}).get("Attributes") or {}
        name = attrs.get("name", "?")
        if action in ("kill", "stop"):
            self._stopping.add(name)
            return None
        if action == "oom":
            return f"🧠💥 {_e(name)} murió por falta de memoria (OOM)"
        if action == "die":
            code = int(attrs.get("exitCode", "0") or 0)
            stopped = name in self._stopping
            self._stopping.discard(name)
            if code in NORMAL_EXIT_CODES or stopped:
                return None
            return f"💥 {_e(name)} terminó con error (código {code})"
        if action == "start":
            project = attrs.get("coolify.resourceName") or attrs.get("com.docker.compose.project") or "sin proyecto"
            service = attrs.get("com.docker.compose.service") or name
            started, services = self._pending.get(project, (now, set()))
            services.add(service)
            self._pending[project] = (started, services)
        return None

    def flush(self, now: float) -> list[str]:
        ready = [p for p, (started, _) in self._pending.items() if now - started >= self.window]
        messages = []
        for project in ready:
            _, services = self._pending.pop(project)
            listed = ", ".join(sorted(services))
            messages.append(f"🚀 Despliegue en <b>{_e(project)}</b>: arrancaron {len(services)} servicio(s) — {_e(listed)}")
        return messages


def stream_docker_events(docker_url: str, on_event: Callable[[dict], None]) -> None:
    filters = json.dumps({"type": ["container"], "event": ["start", "die", "oom", "kill", "stop"]})
    url = f"{docker_url}/events?{urllib.parse.urlencode({'filters': filters})}"
    with urllib.request.urlopen(url, timeout=None) as response:  # noqa: S310 — URL interna fija
        for raw in response:
            line = raw.strip()
            if line:
                on_event(json.loads(line))


# --- alertas de recursos con gráfica ----------------------------------------

RESOURCE_ALERTS = {
    "HostMemoryLow": "ram", "HostMemoryCritical": "ram", "HostSwapHigh": "ram", "HostOomKill": "ram",
    "HostHighLoad": "cpu",
    "HostDiskHigh": "disk", "HostDiskCritical": "disk", "HostDiskWillFillIn24h": "disk",
    "HostNetworkReceiveHigh": "net", "HostNetworkTransmitHigh": "net", "HostNetworkErrors": "net",
}


def new_resource_alerts(alerts: list[dict], seen: set[str]) -> list[tuple[str, str]]:
    """[(fingerprint, recurso)] de alertas de recursos que no se habían visto."""
    found = []
    current = set()
    for alert in alerts:
        resource = RESOURCE_ALERTS.get(alert.get("labels", {}).get("alertname", ""))
        fingerprint = alert.get("fingerprint", "")
        if not resource:
            continue
        current.add(fingerprint)
        if fingerprint not in seen:
            found.append((fingerprint, resource))
    seen.intersection_update(current)  # olvida las resueltas: si vuelven, se avisa de nuevo
    seen.update(fp for fp, _ in found)
    return found


# --- arranque de los hilos ----------------------------------------------------


def _loop(name: str, interval: float, step: Callable[[], None]) -> None:
    def run() -> None:
        while True:
            try:
                step()
            except Exception as exc:  # noqa: BLE001 — un vigilante no puede morir por un fallo puntual
                log.warning("vigilante %s: %s", name, exc)
            time.sleep(interval)

    threading.Thread(target=run, name=f"watch-{name}", daemon=True).start()


def start_watchers(
    notify: Notify,
    send_chart: Callable[[str], None],
    docker_url: str,
    alertmanager_url: str,
    log_dir: str = "/host/log",
    known_ips: frozenset[str] = frozenset(),
) -> None:
    parser = SecurityParser(known_ips=known_ips)
    auth, f2b = LogTail(f"{log_dir}/auth.log"), LogTail(f"{log_dir}/fail2ban.log")

    def security_step() -> None:
        now = time.time()
        for line in auth.read_new_lines():
            message = parser.auth_line(line, now)
            if message:
                notify(message)
        for line in f2b.read_new_lines():
            message = parser.fail2ban_line(line)
            if message:
                notify(message)

    ports_state: dict = {"before": None}

    def ports_step() -> None:
        current = public_ports(get_json(f"{docker_url}/containers/json"))
        if ports_state["before"] is not None:
            for message in diff_ports(ports_state["before"], current):
                notify(message)
        ports_state["before"] = current

    deploys = DeployAggregator()
    lock = threading.Lock()

    def on_event(event: dict) -> None:
        with lock:
            message = deploys.event(event, time.time())
        if message:
            notify(message)

    def events_step() -> None:
        stream_docker_events(docker_url, on_event)  # bloquea; si se corta, el bucle reconecta

    def flush_step() -> None:
        with lock:
            messages = deploys.flush(time.time())
        for message in messages:
            notify(message)

    seen: set[str] = set()

    def resource_step() -> None:
        alerts = get_json(f"{alertmanager_url}/api/v2/alerts", {"active": "true", "silenced": "false"})
        for _, resource in new_resource_alerts(alerts, seen):
            send_chart(resource)

    _loop("seguridad", 20, security_step)
    _loop("puertos", 60, ports_step)
    _loop("eventos", 10, events_step)
    _loop("despliegues", 15, flush_step)
    _loop("recursos", 60, resource_step)
