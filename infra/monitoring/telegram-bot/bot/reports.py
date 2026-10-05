"""Textos de los comandos. Funciones puras sobre `Sources`: se prueban sin red.

Salida en HTML de Telegram: todo lo que viene de afuera (nombres de
contenedores, resúmenes de alertas) pasa por `html.escape`.
"""

from __future__ import annotations

import html
from datetime import datetime, timezone

from dataclasses import dataclass

from .charts import ChartSpec, render_line_chart
from .docker_state import ContainerState
from .sources import Point, Sample, Sources

GIB = 1024**3
MIB = 1024**2
TOP_N = 10
UNLIMITED_MEMORY_BYTES = 2**62  # cAdvisor reporta "sin límite" como un número enorme

FS = 'fstype!~"tmpfs|overlay|squashfs|nsfs|ramfs"'
Q_MEM_TOTAL = "node_memory_MemTotal_bytes"
Q_MEM_AVAILABLE = "node_memory_MemAvailable_bytes"
Q_SWAP_TOTAL = "node_memory_SwapTotal_bytes"
Q_SWAP_FREE = "node_memory_SwapFree_bytes"
Q_DISK_ROOT_USED = f'1 - node_filesystem_avail_bytes{{mountpoint="/",{FS}}} / node_filesystem_size_bytes{{mountpoint="/",{FS}}}'
Q_LOAD_PER_CORE = 'node_load5 / on(instance) count by (instance) (node_cpu_seconds_total{mode="idle"})'
Q_NET_RX = "rate(node_network_receive_bytes_total[5m]) * 8"
Q_NET_TX = "rate(node_network_transmit_bytes_total[5m]) * 8"
Q_CPU_USED = '1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))'
Q_CPU_PER_CORE = '1 - avg by (cpu) (rate(node_cpu_seconds_total{mode="idle"}[5m]))'
Q_CPU_CORES = 'count(node_cpu_seconds_total{mode="idle"})'
Q_LOAD_1 = "node_load1"
Q_LOAD_5 = "node_load5"
Q_LOAD_15 = "node_load15"
Q_CONTAINER_CPU = 'sum by (name) (rate(container_cpu_usage_seconds_total{name!=""}[5m]))'
Q_CONTAINER_MEM = 'container_memory_working_set_bytes{name!=""}'
Q_RAM_USED_GIB_RANGE = "sum(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1073741824"
Q_CORES_IN_USE_RANGE = (
    '(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))) * count(node_cpu_seconds_total{mode="idle"})'
)
Q_CONTAINER_MEM_LIMIT = 'container_spec_memory_limit_bytes{name!=""}'
Q_CONTAINER_NET = 'sum by (name) (rate(container_network_receive_bytes_total{name!=""}[5m]) + rate(container_network_transmit_bytes_total{name!=""}[5m])) * 8'

BAR_WIDTH = 10

HELP_TEXT = (
    "<b>Monitoreo del VPS</b>\n"
    "/status — resumen: RAM, CPU, disco, red, contenedores y alertas\n"
    "/ram — RAM del host y los 10 contenedores que más usan\n"
    "/cpu — uso por núcleo, carga y los contenedores que más CPU usan\n"
    "/graficas — RAM y núcleos en uso de las últimas 24 h, en imagen\n"
    "/red — tráfico por interfaz y los contenedores que más mueven\n"
    "/contenedores — estado, health, uptime y reinicios de cada uno\n"
    "/alertas — alertas activas ahora\n"
    "/ayuda — esta lista\n\n"
    "También en castellano: /estado. Sólo lectura: el bot no reinicia ni cambia nada."
)


def status_report(sources: Sources) -> str:
    return "\n\n".join([
        "<b>📊 Estado del VPS</b>",
        _host_block(sources),
        _containers_summary(*sources.containers()),
        _alerts_summary(sources.active_alerts()),
    ])


def memory_report(sources: Sources) -> str:
    usage = _by_name(sources.query(Q_CONTAINER_MEM))
    limits = _by_name(sources.query(Q_CONTAINER_MEM_LIMIT))
    top = sorted(usage.items(), key=lambda item: item[1], reverse=True)[:TOP_N]
    lines = [f"<b>🧠 RAM</b>\n{_memory_line(sources)}", f"<b>Top {TOP_N} contenedores</b>"]
    lines.extend(f"• {_e(name)}: {_mib(used)}{_limit_suffix(used, limits.get(name))}" for name, used in top)
    if not top:
        lines.append("Sin datos de cAdvisor todavía.")
    return "\n".join(lines)


def cpu_report(sources: Sources) -> str:
    cores = _scalar(sources.query(Q_CPU_CORES))
    per_core = sorted(
        ((labels.get("cpu", "?"), value) for labels, value in sources.query(Q_CPU_PER_CORE)),
        key=lambda item: int(item[0]) if item[0].isdigit() else 0,
    )
    loads = [_scalar(sources.query(q)) for q in (Q_LOAD_1, Q_LOAD_5, Q_LOAD_15)]
    lines = [
        f"<b>🧮 CPU</b> (promedio 5 min)\n{_cpu_line(sources)}",
        f"Carga 1 / 5 / 15 min: {' / '.join(_num(load) for load in loads)}"
        + (f" (sobre {int(cores)} núcleos)" if cores else ""),
        "\n<b>Por núcleo</b>",
    ]
    lines.extend(f"<code>cpu{_e(core):>2} {_bar(value)} {_pct(value):>5}</code>" for core, value in per_core)
    top = sorted(_by_name(sources.query(Q_CONTAINER_CPU)).items(), key=lambda item: item[1], reverse=True)
    lines.append(f"\n<b>Top {TOP_N} contenedores</b> (100 % = un núcleo entero)")
    lines.extend(f"• {_e(name)}: {_pct(value)}" for name, value in top[:TOP_N])
    return "\n".join(lines)


@dataclass(frozen=True)
class Photo:
    png: bytes
    caption: str


def history_charts(sources: Sources) -> list[Photo]:
    total_gib = (_scalar(sources.query(Q_MEM_TOTAL)) or 0) / GIB
    cores = _scalar(sources.query(Q_CPU_CORES))
    ram = sources.query_range(Q_RAM_USED_GIB_RANGE)
    cpu = sources.query_range(Q_CORES_IN_USE_RANGE)
    return [
        Photo(
            render_line_chart(
                ram,
                ChartSpec("RAM usada · últimas 24 h", "GiB", total_gib or None, f"Total {total_gib:.0f} GiB"),
                sources.timezone,
            ),
            f"🧠 RAM últimas 24 h · {_range_summary(ram, 'GiB', total_gib)}",
        ),
        Photo(
            render_line_chart(
                cpu,
                ChartSpec("Núcleos en uso · últimas 24 h", "núcleos", cores, f"{int(cores)} núcleos" if cores else ""),
                sources.timezone,
            ),
            f"🧮 Núcleos en uso últimas 24 h · {_range_summary(cpu, 'núcleos', cores)}",
        ),
    ]


def _range_summary(points: list[Point], unit: str, capacity: float | None) -> str:
    if not points:
        return "sin datos"
    values = [value for _, value in points]
    peak, average = max(values), sum(values) / len(values)
    text = f"pico {peak:.1f} {unit}, promedio {average:.1f} {unit}"
    if capacity:
        text += f" (pico al {peak / capacity * 100:.0f} %)"
    return text


def network_report(sources: Sources) -> str:
    rx = {labels.get("device", "?"): value for labels, value in sources.query(Q_NET_RX)}
    tx = {labels.get("device", "?"): value for labels, value in sources.query(Q_NET_TX)}
    lines = ["<b>🌐 Red del host</b> (promedio 5 min)"]
    lines.extend(
        f"• {_e(device)}: ↓ {_mbps(rx.get(device, 0))} · ↑ {_mbps(tx.get(device, 0))}"
        for device in sorted(set(rx) | set(tx))
    )
    per_container = sorted(_by_name(sources.query(Q_CONTAINER_NET)).items(), key=lambda item: item[1], reverse=True)
    lines.append(f"\n<b>Top {TOP_N} contenedores</b> (entrada + salida)")
    lines.extend(f"• {_e(name)}: {_mbps(value)}" for name, value in per_container[:TOP_N])
    return "\n".join(lines)


def containers_report(states: list[ContainerState], docker_up: bool, now: datetime | None = None) -> str:
    if not docker_up:
        return "⚠️ No pude consultar Docker. Revisá el contenedor docker-read-proxy."
    now = now or datetime.now(timezone.utc)
    lines = [f"<b>📦 Contenedores ({len(states)})</b>"]
    ordered = sorted(states, key=lambda state: (_severity_rank(state), state.display))
    lines.extend(_container_line(state, now) for state in ordered)
    return "\n".join(lines)


def alerts_report(alerts: list[dict]) -> str:
    if not alerts:
        return "✅ Sin alertas activas."
    lines = [f"<b>🚨 Alertas activas ({len(alerts)})</b>"]
    for alert in alerts:
        icon = "🔴" if alert["labels"].get("severity") == "critical" else "🟠"
        summary = alert.get("annotations", {}).get("summary") or alert["labels"].get("alertname", "?")
        lines.append(f"{icon} {_e(summary)}")
    return "\n".join(lines)


# --- bloques -------------------------------------------------------------


def _host_block(sources: Sources) -> str:
    disk = _scalar(sources.query(Q_DISK_ROOT_USED))
    load = _scalar(sources.query(Q_LOAD_PER_CORE))
    rx = sum(value for _, value in sources.query(Q_NET_RX))
    tx = sum(value for _, value in sources.query(Q_NET_TX))
    return "\n".join([
        f"🧠 {_memory_line(sources)}",
        f"🧮 {_cpu_line(sources)}",
        f"💾 Disco /: {_pct(disk)}",
        f"⚙️ Carga 5 min por núcleo: {_num(load)}",
        f"🌐 Red: ↓ {_mbps(rx)} · ↑ {_mbps(tx)}",
    ])


def _memory_line(sources: Sources) -> str:
    total = _scalar(sources.query(Q_MEM_TOTAL))
    available = _scalar(sources.query(Q_MEM_AVAILABLE))
    swap_total = _scalar(sources.query(Q_SWAP_TOTAL))
    swap_free = _scalar(sources.query(Q_SWAP_FREE))
    if total is None or available is None:
        return "RAM: sin datos"
    used = total - available
    line = f"RAM: {used / GIB:.1f} / {total / GIB:.1f} GiB ({_pct(used / total)})"
    if swap_total:
        line += f" · swap {_pct((swap_total - (swap_free or 0)) / swap_total)}"
    return line


def _cpu_line(sources: Sources) -> str:
    used = _scalar(sources.query(Q_CPU_USED))
    cores = _scalar(sources.query(Q_CPU_CORES))
    if used is None:
        return "CPU: sin datos"
    return f"CPU: {_pct(used)} en uso" + (f" de {int(cores)} núcleos" if cores else "")


def _containers_summary(states: list[ContainerState], docker_up: bool) -> str:
    if not docker_up:
        return "📦 Contenedores: ⚠️ no pude consultar Docker"
    running = sum(state.running for state in states)
    unhealthy = [state for state in states if state.unhealthy]
    down = [state for state in states if state.expected_running and not state.running]
    lines = [f"📦 Contenedores: {running} corriendo · {len(unhealthy)} unhealthy · {len(down)} caídos"]
    lines.extend(f"   🔴 {_e(state.display)} unhealthy" for state in unhealthy)
    lines.extend(f"   ⛔ {_e(state.display)} {state.status}" for state in down)
    return "\n".join(lines)


def _alerts_summary(alerts: list[dict]) -> str:
    if not alerts:
        return "✅ Sin alertas activas"
    names = sorted({alert["labels"].get("alertname", "?") for alert in alerts})
    return f"🚨 {len(alerts)} alerta(s) activa(s): {_e(', '.join(names))} — /alertas"


def _container_line(state: ContainerState, now: datetime) -> str:
    icon = {0: "🔴", 1: "⛔", 2: "🟡", 3: "🟢"}[_severity_rank(state)]
    parts = [f"{icon} {_e(state.display)}", state.status]
    if state.health != "none":
        parts.append(state.health)
    if state.running and state.started_at:
        parts.append(f"up {_duration(now - state.started_at)}")
    if state.restart_count:
        parts.append(f"{state.restart_count} reinicios")
    if state.oom_killed:
        parts.append("OOM")
    return " · ".join(parts)


def _severity_rank(state: ContainerState) -> int:
    if state.unhealthy:
        return 0
    if state.expected_running and not state.running:
        return 1
    if not state.running or state.health == "starting" or state.status == "restarting":
        return 2
    return 3


# --- formato -------------------------------------------------------------


def _by_name(samples: list[Sample]) -> dict[str, float]:
    return {labels.get("name", "?"): value for labels, value in samples}


def _scalar(samples: list[Sample]) -> float | None:
    return samples[0][1] if samples else None


def _limit_suffix(used: float, limit: float | None) -> str:
    if not limit or limit >= UNLIMITED_MEMORY_BYTES:
        return " (sin límite)"
    return f" de {_mib(limit)} ({_pct(used / limit)})"


def _bar(ratio: float) -> str:
    filled = round(max(0.0, min(ratio, 1.0)) * BAR_WIDTH)
    return "▰" * filled + "▱" * (BAR_WIDTH - filled)


def _e(text: str) -> str:
    return html.escape(text, quote=False)


def _pct(ratio: float | None) -> str:
    return "?" if ratio is None else f"{ratio * 100:.0f} %"


def _num(value: float | None) -> str:
    return "?" if value is None else f"{value:.2f}"


def _mib(value: float) -> str:
    return f"{value / GIB:.2f} GiB" if value >= GIB else f"{value / MIB:.0f} MiB"


def _mbps(bits_per_second: float) -> str:
    return f"{bits_per_second / 1e6:.2f} Mbit/s"


def _duration(delta) -> str:
    seconds = max(int(delta.total_seconds()), 0)
    days, rest = divmod(seconds, 86400)
    hours, rest = divmod(rest, 3600)
    minutes = rest // 60
    if days:
        return f"{days}d {hours}h"
    if hours:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"
