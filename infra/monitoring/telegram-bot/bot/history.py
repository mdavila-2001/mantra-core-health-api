"""Gráficas de las últimas 24 h: RAM, CPU, disco, red y contenedores que más consumen."""

from __future__ import annotations

import re

from .charts import ChartSpec, render_line_chart, render_multi_line_chart
from .reports import FS, GIB, Q_CPU_CORES, Q_MEM_TOTAL, Photo, _range_summary, _scalar
from .sources import Sources

TOP_CONTAINERS = 5
Q_RAM_GIB = "sum(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1073741824"
Q_CORES_IN_USE = '(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))) * count(node_cpu_seconds_total{mode="idle"})'
Q_DISK_USED_GIB = f'sum(node_filesystem_size_bytes{{mountpoint="/",{FS}}} - node_filesystem_avail_bytes{{mountpoint="/",{FS}}}) / 1073741824'
Q_DISK_SIZE = f'sum(node_filesystem_size_bytes{{mountpoint="/",{FS}}})'
Q_NET_IN_MBPS = 'sum(rate(node_network_receive_bytes_total[5m])) * 8 / 1e6'
Q_NET_OUT_MBPS = 'sum(rate(node_network_transmit_bytes_total[5m])) * 8 / 1e6'
Q_TOP_CONTAINER_RAM = f'topk({TOP_CONTAINERS}, container_memory_working_set_bytes{{name!=""}} / 1073741824)'


def resource_charts(sources: Sources) -> list[Photo]:
    """RAM, núcleos, disco y red de las últimas 24 h, más los contenedores que más RAM usan."""
    tz = sources.timezone
    total_gib = (_scalar(sources.query(Q_MEM_TOTAL)) or 0) / GIB
    cores = _scalar(sources.query(Q_CPU_CORES))
    disk_gib = (_scalar(sources.query(Q_DISK_SIZE)) or 0) / GIB
    ram = sources.query_range(Q_RAM_GIB)
    cpu = sources.query_range(Q_CORES_IN_USE)
    disk = sources.query_range(Q_DISK_USED_GIB)
    net_in = sources.query_range(Q_NET_IN_MBPS)
    net_out = sources.query_range(Q_NET_OUT_MBPS)
    top = _top_container_series(sources)
    return [
        Photo(
            render_line_chart(ram, ChartSpec("RAM usada · últimas 24 h", "GiB", total_gib or None, f"Total {total_gib:.0f} GiB"), tz),
            f"🧠 RAM · {_range_summary(ram, 'GiB', total_gib)}",
        ),
        Photo(
            render_line_chart(cpu, ChartSpec("Núcleos en uso · últimas 24 h", "núcleos", cores, f"{int(cores)} núcleos" if cores else ""), tz),
            f"🧮 CPU · {_range_summary(cpu, 'núcleos', cores)}",
        ),
        Photo(
            render_line_chart(disk, ChartSpec("Disco / usado · últimas 24 h", "GiB", disk_gib or None, f"Total {disk_gib:.0f} GiB"), tz),
            f"💾 Disco · {_range_summary(disk, 'GiB', disk_gib)}",
        ),
        Photo(
            render_multi_line_chart([("Entrada", net_in), ("Salida", net_out)], ChartSpec("Tráfico de red · últimas 24 h", "Mbit/s", None, ""), tz),
            f"🌐 Red · entrada {_range_summary(net_in, 'Mbit/s', None)} · salida {_range_summary(net_out, 'Mbit/s', None)}",
        ),
        Photo(
            render_multi_line_chart(top, ChartSpec(f"RAM de los {TOP_CONTAINERS} contenedores que más usan · 24 h", "GiB", None, ""), tz),
            f"📦 Los {TOP_CONTAINERS} contenedores que más RAM usan ahora, con su historia de 24 h",
        ),
    ]


def _top_container_series(sources: Sources) -> list[tuple[str, list]]:
    names = [labels.get("name", "?") for labels, _ in sources.query(Q_TOP_CONTAINER_RAM)]
    series = []
    for name in names:
        points = sources.query_range(f'container_memory_working_set_bytes{{name="{name}"}} / 1073741824')
        series.append((short_name(name), points))
    return series


_NOISE = re.compile(r"^([a-z0-9]{24}|\d{8}T\d{6}|\d{9,})$")


def short_name(name: str) -> str:
    """Coolify nombra «servicio-<uuid de 24>-<marca de tiempo>»: sin el ruido queda el servicio."""
    kept = [part for part in name.split("-") if not _NOISE.match(part)]
    return "-".join(kept) or name
