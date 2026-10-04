#!/bin/sh
# Alertmanager no expande variables de entorno en su configuración. Este guion
# arma el archivo final a partir de la plantilla con las variables que Coolify
# inyecta, y falla en voz alta si falta alguna: un Alertmanager que arranca sin
# destino es peor que uno que no arranca, porque parece que vigila.
set -eu

: "${TELEGRAM_BOT_TOKEN:?falta TELEGRAM_BOT_TOKEN}"
: "${TELEGRAM_CHAT_ID:?falta TELEGRAM_CHAT_ID}"
: "${HEALTHCHECKS_PING_URL:?falta HEALTHCHECKS_PING_URL}"

case "$TELEGRAM_CHAT_ID" in
  ''|*[!0-9-]*) echo "TELEGRAM_CHAT_ID debe ser un número (los grupos empiezan con -)" >&2; exit 1 ;;
esac
case "$HEALTHCHECKS_PING_URL" in
  https://*) ;;
  *) echo "HEALTHCHECKS_PING_URL debe empezar con https://" >&2; exit 1 ;;
esac

RUNTIME_DIR=/alertmanager/runtime
mkdir -p "$RUNTIME_DIR"

# El token va a un archivo (bot_token_file), no al YAML: así no aparece en
# /api/v2/status ni en el volcado de la configuración que muestra la UI.
umask 077
printf '%s' "$TELEGRAM_BOT_TOKEN" > "$RUNTIME_DIR/telegram_token"
printf '%s' "$HEALTHCHECKS_PING_URL" > "$RUNTIME_DIR/healthchecks_url"

sed -e "s|__TELEGRAM_CHAT_ID__|$TELEGRAM_CHAT_ID|g" \
    -e "s|__RUNTIME_DIR__|$RUNTIME_DIR|g" \
    /etc/alertmanager/alertmanager.yml.tmpl > "$RUNTIME_DIR/alertmanager.yml"

exec /bin/alertmanager \
  --config.file="$RUNTIME_DIR/alertmanager.yml" \
  --storage.path=/alertmanager \
  "$@"
