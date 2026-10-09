"""Comandos de consulta rápida: /disco, /top, /sitios, /uptime."""

from __future__ import annotations

import time

from .history import short_name
from .reports import FS, GIB, _e, _pct, _scalar
from .sources import Sources

TOP_N = 10
Q_DISKS = f'node_filesystem_size_bytes{{{FS}}}'
Q_DISKS_AVAIL = f'node_filesystem_avail_bytes{{{FS}}}'
Q_DISK_GROWTH_24H = f'(node_filesystem_avail_bytes{{mountpoint="/",{FS}}} offset 24h) - node_filesystem_avail_bytes{{mountpoint="/",{FS}}}'
Q_TOP_CPU = f'topk({TOP_N}, sum by (name) (rate(container_cpu_usage_seconds_total{{name!=""}}[5m])))'
Q_TOP_RAM = f'topk({TOP_N}, container_memory_working_set_bytes{{name!=""}})'
Q_PROBE_UP = 'probe_success{job="blackbox-http"}'
Q_PROBE_SECONDS = 'probe_duration_seconds{job="blackbox-http"}'
Q_PROBE_STATUS = 'probe_http_status_code{job="blackbox-http"}'
Q_PROBE_CERT_DAYS = '(probe_ssl_earliest_cert_expiry{job="blackbox-http"} - time()) / 86400'
Q_PROBE_UPTIME_24H = 'avg_over_time(probe_success{job="blackbox-http"}[24h])'
Q_BOOT = "node_boot_time_seconds"
Q_LOADS = ("node_load1", "node_load5", "node_load15")
Q_CORES = 'count(node_cpu_seconds_total{mode="idle"})'


def disk_report(sources: Sources) -> str:
    sizes = {labels.get("mountpoint", "?"): value for labels, value in sources.query(Q_DISKS)}
    avail = {labels.get("mountpoint", "?"): value for labels, value in sources.query(Q_DISKS_AVAIL)}
    lines = ["<b>💾 Disco</b>"]
    for mount in sorted(sizes):
        size, free = sizes[mount], avail.get(mount, 0)
        used = size - free
        lines.append(f"• {_e(mount)}: {used / GIB:.0f} / {size / GIB:.0f} GiB ({_pct(used / size if size else None)}) · libres {free / GIB:.0f} GiB")
    growth = _scalar(sources.query(Q_DISK_GROWTH_24H))
    if growth is not None:
        trend = f"creció {growth / GIB:.1f} GiB" if growth >= 0 else f"se liberaron {-growth / GIB:.1f} GiB"
        lines.append(f"\nÚltimas 24 h en /: {trend}.")
        root_free = avail.get("/")
        if growth > 0 and root_free:
            lines.append(f"Al ritmo de hoy, / se llena en ~{root_free / growth:.0f} días.")
    return "\n".join(lines)


def top_report(sources: Sources) -> str:
    cpu = sorted(((labels.get("name", "?"), v) for labels, v in sources.query(Q_TOP_CPU)), key=lambda x: -x[1])
    ram = sorted(((labels.get("name", "?"), v) for labels, v in sources.query(Q_TOP_RAM)), key=lambda x: -x[1])
    lines = [f"<b>🔥 Top {TOP_N} por CPU</b> (1,00 = un núcleo entero)"]
    lines.extend(f"• {_e(short_name(name))}: {value:.2f}" for name, value in cpu)
    lines.append(f"\n<b>🧠 Top {TOP_N} por RAM</b>")
    lines.extend(f"• {_e(short_name(name))}: {value / GIB:.2f} GiB" for name, value in ram)
    if not cpu and not ram:
        lines.append("Sin datos de cAdvisor todavía.")
    return "\n".join(lines)


def sites_report(sources: Sources) -> str:
    def by_instance(expr: str) -> dict[str, float]:
        return {labels.get("instance", "?"): value for labels, value in sources.query(expr)}

    up, seconds, status = by_instance(Q_PROBE_UP), by_instance(Q_PROBE_SECONDS), by_instance(Q_PROBE_STATUS)
    cert, uptime = by_instance(Q_PROBE_CERT_DAYS), by_instance(Q_PROBE_UPTIME_24H)
    if not up:
        return "Sin datos de las sondas todavía."
    lines = ["<b>🌍 Sitios públicos</b>"]
    for site in sorted(up):
        icon = "🟢" if up[site] == 1 else "🔴"
        parts = [f"{icon} {_e(site)}", f"HTTP {int(status.get(site, 0))}", f"{seconds.get(site, 0) * 1000:.0f} ms"]
        if site in uptime:
            parts.append(f"24 h: {_pct(uptime[site])} arriba")
        if site in cert:
            parts.append(f"cert {cert[site]:.0f} días")
        lines.append(" · ".join(parts))
    return "\n".join(lines)


def uptime_report(sources: Sources) -> str:
    boot = _scalar(sources.query(Q_BOOT))
    cores = _scalar(sources.query(Q_CORES))
    loads = [_scalar(sources.query(q)) for q in Q_LOADS]
    lines = ["<b>⏱ Servidor</b>"]
    if boot:
        days, rest = divmod(int(time.time() - boot), 86400)
        lines.append(f"Encendido hace {days} d {rest // 3600} h")
    lines.append("Carga 1 / 5 / 15 min: " + " / ".join("?" if v is None else f"{v:.2f}" for v in loads)
                 + (f" (sobre {int(cores)} núcleos)" if cores else ""))
    return "\n".join(lines)
