"""Gráficas de las últimas 24 h como PNG para mandar por Telegram.

Una serie por gráfica y una sola escala: la RAM en GiB contra el total del
servidor, y los núcleos en uso contra los núcleos que hay. La línea de
capacidad es una referencia gris rotulada, no una segunda serie.
Paleta y trazos según la guía de visualización del proyecto: línea de 2 px,
grilla de 1 px recesiva, texto en tinta (nunca del color de la serie).
"""

from __future__ import annotations

import io
from dataclasses import dataclass
from datetime import datetime
from zoneinfo import ZoneInfo

import matplotlib

matplotlib.use("Agg")  # sin pantalla: dibuja directo a PNG

import matplotlib.dates as mdates  # noqa: E402 — después de elegir el backend
import matplotlib.pyplot as plt  # noqa: E402

SURFACE = "#fcfcfb"
INK = "#0b0b0b"
INK_SECONDARY = "#52514e"
GRID = "#e8e7e3"
SERIES = "#2a78d6"
CAPACITY = "#8c8b86"

Point = tuple[float, float]  # (unix time, valor)


@dataclass(frozen=True)
class ChartSpec:
    title: str
    unit: str
    capacity: float | None
    capacity_label: str


def render_line_chart(points: list[Point], spec: ChartSpec, timezone: str) -> bytes:
    zone = ZoneInfo(timezone)
    times = [datetime.fromtimestamp(ts, zone) for ts, _ in points]
    values = [value for _, value in points]

    fig, ax = plt.subplots(figsize=(10, 4.2), dpi=110)
    fig.patch.set_facecolor(SURFACE)
    ax.set_facecolor(SURFACE)

    if points:
        ax.plot(times, values, color=SERIES, linewidth=2, solid_joinstyle="round", solid_capstyle="round")
        ax.fill_between(times, values, color=SERIES, alpha=0.08, linewidth=0)
        ax.annotate(
            f"{values[-1]:.1f} {spec.unit}",
            xy=(times[-1], values[-1]),
            xytext=(6, 0),
            textcoords="offset points",
            va="center",
            fontsize=10,
            color=INK,
        )
    else:
        ax.text(0.5, 0.5, "Sin datos en las últimas 24 h", transform=ax.transAxes,
                ha="center", va="center", color=INK_SECONDARY, fontsize=11)

    top = max(values, default=0.0)
    if spec.capacity:
        ax.axhline(spec.capacity, color=CAPACITY, linewidth=1)
        ax.annotate(spec.capacity_label, xy=(0, spec.capacity), xycoords=("axes fraction", "data"),
                    xytext=(4, 4), textcoords="offset points", fontsize=9, color=INK_SECONDARY)
        top = max(top, spec.capacity)
    ax.set_ylim(0, top * 1.12 or 1)

    ax.set_title(spec.title, loc="left", fontsize=13, color=INK, pad=12)
    ax.set_ylabel(spec.unit, color=INK_SECONDARY, fontsize=10)
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%H:%M", tz=zone))
    ax.grid(axis="y", color=GRID, linewidth=1)
    ax.tick_params(colors=INK_SECONDARY, labelsize=9, length=0)
    for side in ("top", "right", "left"):
        ax.spines[side].set_visible(False)
    ax.spines["bottom"].set_color(GRID)

    fig.tight_layout()
    buffer = io.BytesIO()
    fig.savefig(buffer, format="png", facecolor=SURFACE)
    plt.close(fig)
    return buffer.getvalue()
