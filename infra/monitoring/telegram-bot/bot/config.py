"""Configuración leída del entorno. Falla al arrancar si falta algo obligatorio."""

from __future__ import annotations

import os
from dataclasses import dataclass


class ConfigError(RuntimeError):
    """Falta o es inválida una variable de entorno obligatoria."""


@dataclass(frozen=True)
class Config:
    telegram_token: str
    telegram_chat_id: int
    prometheus_url: str
    alertmanager_url: str
    docker_url: str
    exporter_port: int
    daily_summary_hour: int
    summary_timezone: str


def _required(env: dict[str, str], name: str) -> str:
    value = env.get(name, "").strip()
    if not value:
        raise ConfigError(f"falta la variable {name}")
    return value


def _int(env: dict[str, str], name: str, default: str) -> int:
    raw = env.get(name, default).strip()
    try:
        return int(raw)
    except ValueError as exc:
        raise ConfigError(f"{name} debe ser un número entero, llegó {raw!r}") from exc


def load_config(env: dict[str, str] | None = None) -> Config:
    env = dict(os.environ) if env is None else env
    chat_id_raw = _required(env, "TELEGRAM_CHAT_ID")
    try:
        chat_id = int(chat_id_raw)
    except ValueError as exc:
        raise ConfigError("TELEGRAM_CHAT_ID debe ser un número (los grupos empiezan con -)") from exc
    hour = _int(env, "DAILY_SUMMARY_HOUR", "8")
    if not 0 <= hour <= 23:
        raise ConfigError("DAILY_SUMMARY_HOUR debe estar entre 0 y 23")
    return Config(
        telegram_token=_required(env, "TELEGRAM_BOT_TOKEN"),
        telegram_chat_id=chat_id,
        prometheus_url=env.get("PROMETHEUS_URL", "http://prometheus:9090").rstrip("/"),
        alertmanager_url=env.get("ALERTMANAGER_URL", "http://alertmanager:9093").rstrip("/"),
        docker_url=env.get("DOCKER_URL", "http://docker-read-proxy:2375").rstrip("/"),
        exporter_port=_int(env, "EXPORTER_PORT", "9200"),
        daily_summary_hour=hour,
        summary_timezone=env.get("SUMMARY_TIMEZONE", "America/La_Paz"),
    )
