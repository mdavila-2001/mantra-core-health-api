"""Arranque: exportador + long polling de Telegram + resumen diario."""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, date
from zoneinfo import ZoneInfo

from . import history, reports
from .commands import MENU, reply_for
from .config import Config, load_config
from .docker_state import fetch_container_states
from .exporter import DockerStateCache, serve_exporter
from .sources import LiveSources, Sources
from .telegram import TelegramClient

log = logging.getLogger("alovida-bot")

ERROR_BACKOFF_SECONDS = 15
SUMMARY_CHECK_SECONDS = 30


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    config = load_config()
    cache = DockerStateCache(lambda: fetch_container_states(config.docker_url))
    serve_exporter(config.exporter_port, cache)
    sources = LiveSources(config.prometheus_url, config.alertmanager_url, cache.get, config.summary_timezone)
    telegram = TelegramClient(config.telegram_token)

    threading.Thread(
        target=_daily_summary_loop, args=(config, telegram, sources), name="daily-summary", daemon=True
    ).start()
    try:
        telegram.set_commands(MENU)
    except Exception as exc:  # noqa: BLE001 — sin menú los comandos igual funcionan
        log.warning("no se pudo registrar el menú de comandos: %s", exc)
    _safe_send(telegram, config.telegram_chat_id, "🟢 Monitoreo del VPS iniciado. Probá /status o /ayuda.")
    log.info("exportador en :%s y bot escuchando", config.exporter_port)
    _poll_forever(config, telegram, sources)


def _poll_forever(config: Config, telegram: TelegramClient, sources: Sources) -> None:
    offset: int | None = None
    while True:
        try:
            for update in telegram.get_updates(offset):
                offset = update["update_id"] + 1
                reply = reply_for(update.get("message") or {}, config.telegram_chat_id, sources)
                _deliver(telegram, config.telegram_chat_id, reply)
        except Exception as exc:  # noqa: BLE001 — un corte de red no puede matar al bot
            log.warning("long polling falló: %s; reintento en %ss", exc, ERROR_BACKOFF_SECONDS)
            time.sleep(ERROR_BACKOFF_SECONDS)


def _daily_summary_loop(config: Config, telegram: TelegramClient, sources: Sources) -> None:
    zone = ZoneInfo(config.summary_timezone)
    last_sent: date | None = None
    while True:
        now = datetime.now(zone)
        if now.hour == config.daily_summary_hour and now.date() != last_sent:
            last_sent = now.date()
            try:
                text = "☀️ <b>Resumen diario</b>\n\n" + reports.status_report(sources)
            except Exception as exc:  # noqa: BLE001
                text = f"☀️ Resumen diario: no pude armarlo ({type(exc).__name__})."
            _safe_send(telegram, config.telegram_chat_id, text)
            try:
                _deliver(telegram, config.telegram_chat_id, history.resource_charts(sources))
            except Exception as exc:  # noqa: BLE001 — el resumen en texto ya salió
                log.warning("no se pudieron mandar las gráficas del resumen: %s", exc)
        time.sleep(SUMMARY_CHECK_SECONDS)


def _deliver(telegram: TelegramClient, chat_id: int, reply) -> None:
    if not reply:
        return
    if isinstance(reply, str):
        telegram.send_message(chat_id, reply)
        return
    for photo in reply:
        telegram.send_photo(chat_id, photo.png, photo.caption)


def _safe_send(telegram: TelegramClient, chat_id: int, text: str) -> None:
    try:
        telegram.send_message(chat_id, text)
    except Exception as exc:  # noqa: BLE001
        log.warning("no se pudo enviar a Telegram: %s", exc)


if __name__ == "__main__":
    main()
