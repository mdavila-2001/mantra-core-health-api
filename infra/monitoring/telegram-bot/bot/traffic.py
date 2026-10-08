"""Tráfico, latencia y endpoints: /trafico (texto) y /tablero (una imagen).

Dos fuentes:
- Traefik (el proxy de Coolify): todo lo que entra a cada sitio. Los routers se
  traducen a dominio con `alovida_router_info`, que publica este mismo bot.
- OpenTelemetry de la API (collector con spanmetrics): qué endpoints se tocan,
  cuánto tardan y cuántos fallan. Si la API todavía no manda trazas, el tablero
  lo dice y muestra los sitios en su lugar.
"""

from __future__ import annotations

import math
import re
from datetime import datetime
from zoneinfo import ZoneInfo

import matplotlib.dates as mdates
import matplotlib.pyplot as plt

from .charts import CATEGORICAL, GRID, INK, INK_SECONDARY, SURFACE, _style_axes, _to_png
from .reports import Photo, _e
from .sources import Point, Sample, Sources

TOP_ENDPOINTS = 10
MAX_SITES = 6

# Coolify crea para cada dominio un router `http-N-…` que sólo redirige a
# https: se excluye para no contar dos veces ni bajar la latencia con 301.
ROUTERS = 'router!~"http-[0-9]+-.*"'
SITE = "* on (router) group_left (site) alovida_router_info"
REQS = f"traefik_router_requests_total{{{ROUTERS}}}"
BUCKETS = f"traefik_router_request_duration_seconds_bucket{{{ROUTERS}}}"

Q_SITE_RPM = f"sum by (site) (rate({REQS}[5m]) {SITE}) * 60"
Q_SITE_REQ_24H = f"sum by (site) (increase({REQS}[24h]) {SITE})"
Q_SITE_5XX_24H = f'sum by (site) (increase(traefik_router_requests_total{{{ROUTERS},code=~"5.."}}[24h]) {SITE})'
Q_SITE_P95_NOW = f"histogram_quantile(0.95, sum by (le, site) (rate({BUCKETS}[15m]) {SITE}))"
Q_SITE_P95_24H = f"histogram_quantile(0.95, sum by (le, site) (rate({BUCKETS}[24h]) {SITE}))"
Q_SITE_RPM_RANGE = Q_SITE_RPM
Q_SITE_P95_RANGE = f"histogram_quantile(0.95, sum by (le, site) (rate({BUCKETS}[5m]) {SITE}))"
Q_CODES_RANGE = (
    f'sum by (code_class) (label_replace(rate({REQS}[5m]), "code_class", "${{1}}xx", "code", "([0-9]).*")) * 60'
)
Q_TOTAL_REQ_24H = f"sum(increase({REQS}[24h]))"
Q_TOTAL_5XX_24H = f'sum(increase(traefik_router_requests_total{{{ROUTERS},code=~"5.."}}[24h]))'
Q_TOTAL_RPM = f"sum(rate({REQS}[5m])) * 60"
Q_TOTAL_P95_NOW = f"histogram_quantile(0.95, sum by (le) (rate({BUCKETS}[15m])))"

# spanmetrics del collector: sólo los spans SERVER (un pedido HTTP que entra).
SPANS = 'span_kind="SPAN_KIND_SERVER"'
ENDPOINT = "service_name, http_request_method, http_route"
Q_ENDPOINT_CALLS_24H = (
    f"topk({TOP_ENDPOINTS}, sum by ({ENDPOINT}) (increase(traces_span_metrics_calls_total{{{SPANS}}}[24h])))"
)
Q_ENDPOINT_ERRORS_24H = (
    f'sum by ({ENDPOINT}) (increase(traces_span_metrics_calls_total{{{SPANS},http_response_status_code=~"5.."}}[24h]))'
)
Q_ENDPOINT_P95_24H = (
    f"histogram_quantile(0.95, sum by (le, {ENDPOINT}) "
    f"(rate(traces_span_metrics_duration_seconds_bucket{{{SPANS}}}[24h])))"
)

CODE_COLORS = {"2xx": CATEGORICAL[2], "3xx": CATEGORICAL[0], "4xx": CATEGORICAL[3], "5xx": "#e34948"}


# --- /trafico ------------------------------------------------------------------


def traffic_report(sources: Sources) -> str:
    requests = _by_site(sources.query(Q_SITE_REQ_24H))
    if not requests:
        return (
            "Sin datos de tráfico todavía. Prometheus lee el proxy cada 30 s: "
            "si pasa más de un minuto, mirá /alertas (TraefikMetricsDown)."
        )
    rpm = _by_site(sources.query(Q_SITE_RPM))
    errors = _by_site(sources.query(Q_SITE_5XX_24H))
    p95 = _by_site(sources.query(Q_SITE_P95_NOW))
    lines = ["<b>🚦 Tráfico por sitio</b> (medido en el proxy)"]
    for site in sorted(requests, key=lambda s: -requests[s]):
        total = requests[site]
        error_share = errors.get(site, 0) / total if total else 0
        icon = "🔴" if error_share > 0.05 else "🟢"
        lines.append(
            f"{icon} <b>{_e(site)}</b>\n"
            f"   ahora {rpm.get(site, 0):.1f} ped/min · p95 {_seconds(p95.get(site))} · "
            f"24 h: {_count(total)} pedidos, {error_share * 100:.1f} % con 5xx"
        )
    lines.append("\n/tablero — gráficas de 24 h y endpoints más tocados")
    return "\n".join(lines)


# --- /tablero --------------------------------------------------------------------


def dashboard(sources: Sources) -> list[Photo]:
    zone = ZoneInfo(sources.timezone)
    kpis = _kpis(sources)
    fig = plt.figure(figsize=(12, 9.6), dpi=110)
    fig.patch.set_facecolor(SURFACE)
    grid = fig.add_gridspec(3, 2, height_ratios=[0.5, 1, 1.15], hspace=0.55, wspace=0.22)

    _draw_kpis(fig.add_subplot(grid[0, :]), kpis)
    _draw_lines(fig.add_subplot(grid[1, 0]), _site_series(sources, Q_SITE_RPM_RANGE), "Pedidos por minuto, por sitio", "ped/min", zone)
    _draw_lines(fig.add_subplot(grid[1, 1]), _site_series(sources, Q_SITE_P95_RANGE), "Latencia p95, por sitio", "segundos", zone)
    _draw_codes(fig.add_subplot(grid[2, 0]), sources, zone)
    endpoints = endpoint_rows(sources)
    table_ax = fig.add_subplot(grid[2, 1])
    if endpoints:
        _draw_table(table_ax, "Endpoints más tocados · 24 h", ["Endpoint", "Pedidos", "p95", "5xx"], endpoints)
    else:
        _draw_table(table_ax, "Sitios · 24 h (endpoints: falta OTel)", ["Sitio", "Pedidos", "p95", "5xx"], _site_rows(sources))

    fig.suptitle("Tablero de tráfico · últimas 24 h", x=0.02, ha="left", fontsize=15, color=INK)
    caption = (
        f"📊 Tablero · {_count(kpis['requests'])} pedidos en 24 h · ahora {kpis['rpm']:.1f} ped/min · "
        f"p95 {_seconds(kpis['p95'])} · 5xx {kpis['error_share'] * 100:.1f} %"
    )
    if not endpoints:
        caption += "\nLa tabla de endpoints aparece cuando la API mande trazas (OpenTelemetry)."
    return [Photo(_to_png(fig), caption)]


def endpoint_rows(sources: Sources) -> list[list[str]]:
    calls = sources.query(Q_ENDPOINT_CALLS_24H)
    if not calls:
        return []
    errors = {_endpoint_key(labels): value for labels, value in sources.query(Q_ENDPOINT_ERRORS_24H)}
    p95 = {_endpoint_key(labels): value for labels, value in sources.query(Q_ENDPOINT_P95_24H)}
    rows = []
    for labels, count in sorted(calls, key=lambda sample: -sample[1]):
        key = _endpoint_key(labels)
        share = errors.get(key, 0) / count if count else 0
        rows.append([_endpoint_label(labels), _count(count), _seconds(p95.get(key)), f"{share * 100:.1f} %"])
    return rows


def _site_rows(sources: Sources) -> list[list[str]]:
    requests = _by_site(sources.query(Q_SITE_REQ_24H))
    errors = _by_site(sources.query(Q_SITE_5XX_24H))
    p95 = _by_site(sources.query(Q_SITE_P95_24H))
    rows = []
    for site in sorted(requests, key=lambda s: -requests[s])[:TOP_ENDPOINTS]:
        total = requests[site]
        share = errors.get(site, 0) / total if total else 0
        rows.append([site, _count(total), _seconds(p95.get(site)), f"{share * 100:.1f} %"])
    return rows


def _kpis(sources: Sources) -> dict[str, float | None]:
    requests = _scalar(sources.query(Q_TOTAL_REQ_24H)) or 0.0
    errors = _scalar(sources.query(Q_TOTAL_5XX_24H)) or 0.0
    return {
        "requests": requests,
        "rpm": _scalar(sources.query(Q_TOTAL_RPM)) or 0.0,
        "p95": _scalar(sources.query(Q_TOTAL_P95_NOW)),
        "error_share": errors / requests if requests else 0.0,
    }


def _site_series(sources: Sources, expr: str) -> list[tuple[str, list[Point]]]:
    series = [(labels.get("site", "?"), _finite(points)) for labels, points in sources.query_range_series(expr)]
    series = [(site, points) for site, points in series if points]
    series.sort(key=lambda item: -max(value for _, value in item[1]))
    return series[:MAX_SITES]


# --- dibujo ----------------------------------------------------------------------


def _draw_kpis(ax, kpis: dict[str, float | None]) -> None:
    ax.axis("off")
    cards = [
        ("Pedidos 24 h", _count(kpis["requests"])),
        ("Ahora", f"{kpis['rpm']:.1f} ped/min"),
        ("Latencia p95 (15 min)", _seconds(kpis["p95"])),
        ("Errores 5xx 24 h", f"{kpis['error_share'] * 100:.1f} %"),
    ]
    for index, (label, value) in enumerate(cards):
        x = 0.01 + index * 0.25
        ax.text(x, 0.75, label, transform=ax.transAxes, fontsize=10, color=INK_SECONDARY, va="center")
        ax.text(x, 0.25, value, transform=ax.transAxes, fontsize=20, color=INK, va="center", fontweight="bold")


def _draw_lines(ax, series: list[tuple[str, list[Point]]], title: str, unit: str, zone: ZoneInfo) -> None:
    ax.set_facecolor(SURFACE)
    top = 0.0
    for index, (label, points) in enumerate(series):
        times = [datetime.fromtimestamp(ts, zone) for ts, _ in points]
        values = [value for _, value in points]
        top = max(top, max(values))
        ax.plot(times, values, color=CATEGORICAL[index], linewidth=2, label=_short_site(label))
    if not series:
        ax.text(0.5, 0.5, "Sin datos en las últimas 24 h", transform=ax.transAxes,
                ha="center", va="center", color=INK_SECONDARY, fontsize=10)
    ax.set_ylim(0, top * 1.15 or 1)
    _finish_axes(ax, title, unit, zone)
    if series:
        legend = ax.legend(loc="upper left", frameon=False, fontsize=8, ncol=2)
        for text in legend.get_texts():
            text.set_color(INK)


def _draw_codes(ax, sources: Sources, zone: ZoneInfo) -> None:
    ax.set_facecolor(SURFACE)
    by_class = {labels.get("code_class", "?"): _finite(points) for labels, points in sources.query_range_series(Q_CODES_RANGE)}
    classes = [code for code in CODE_COLORS if by_class.get(code)]
    if classes:
        times_ref = [ts for ts, _ in by_class[classes[0]]]
        times = [datetime.fromtimestamp(ts, zone) for ts in times_ref]
        stacks = []
        for code in classes:
            values = dict(by_class[code])
            stacks.append([values.get(ts, 0.0) for ts in times_ref])
        ax.stackplot(times, stacks, colors=[CODE_COLORS[c] for c in classes], labels=classes, alpha=0.85, linewidth=0)
        legend = ax.legend(loc="upper left", frameon=False, fontsize=8, ncol=4)
        for text in legend.get_texts():
            text.set_color(INK)
    else:
        ax.text(0.5, 0.5, "Sin datos en las últimas 24 h", transform=ax.transAxes,
                ha="center", va="center", color=INK_SECONDARY, fontsize=10)
    _finish_axes(ax, "Respuestas por código (ped/min)", "ped/min", zone)


def _draw_table(ax, title: str, header: list[str], rows: list[list[str]]) -> None:
    ax.axis("off")
    ax.set_title(title, loc="left", fontsize=12, color=INK, pad=8)
    if not rows:
        ax.text(0.5, 0.5, "Sin datos todavía", transform=ax.transAxes, ha="center", va="center",
                color=INK_SECONDARY, fontsize=10)
        return
    cells = [[_clip(row[0], 38), *row[1:]] for row in rows]
    table = ax.table(cellText=cells, colLabels=header, colWidths=[0.58, 0.16, 0.13, 0.13],
                     loc="upper left", cellLoc="right", colLoc="right")
    table.auto_set_font_size(False)
    table.set_fontsize(8.5)
    table.scale(1, 1.32)
    for (row, col), cell in table.get_celld().items():
        cell.set_edgecolor(GRID)
        cell.set_facecolor(SURFACE)
        cell.get_text().set_color(INK if row else INK_SECONDARY)
        if col == 0:
            cell.get_text().set_horizontalalignment("left")
        if row and col == 3 and _percent(rows[row - 1][3]) > 5:
            cell.get_text().set_color("#e34948")


def _finish_axes(ax, title: str, unit: str, zone: ZoneInfo) -> None:
    ax.set_title(title, loc="left", fontsize=12, color=INK, pad=8)
    ax.set_ylabel(unit, color=INK_SECONDARY, fontsize=9)
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M", tz=zone))
    _style_axes(ax)


# --- utilidades ------------------------------------------------------------------


def _by_site(samples: list[Sample]) -> dict[str, float]:
    return {labels.get("site", "?"): value for labels, value in samples if not math.isnan(value)}


def _scalar(samples: list[Sample]) -> float | None:
    if not samples or math.isnan(samples[0][1]):
        return None
    return samples[0][1]


def _finite(points: list[Point]) -> list[Point]:
    return [(ts, value) for ts, value in points if math.isfinite(value)]


def _endpoint_key(labels: dict[str, str]) -> tuple[str, str, str]:
    return (labels.get("service_name", ""), labels.get("http_request_method", ""), labels.get("http_route", ""))


def _endpoint_label(labels: dict[str, str]) -> str:
    method = labels.get("http_request_method", "")
    route = labels.get("http_route") or "(sin ruta)"
    return f"{method} {route}".strip()


_SSLIP = re.compile(r"\.\d+\.\d+\.\d+\.\d+\.sslip\.io")


def _short_site(site: str) -> str:
    # «test.62.169.18.132.sslip.io/ai» → «test/ai»: la leyenda tiene poco lugar.
    return _SSLIP.sub("", site)


def _seconds(value: float | None) -> str:
    if value is None or not math.isfinite(value):
        return "—"
    return f"{value * 1000:.0f} ms" if value < 1 else f"{value:.2f} s"


def _count(value: float) -> str:
    return f"{value:,.0f}".replace(",", ".")


def _percent(text: str) -> float:
    try:
        return float(text.split()[0])
    except (ValueError, IndexError):
        return 0.0


def _clip(text: str, width: int) -> str:
    return text if len(text) <= width else text[: width - 1] + "…"
