#!/usr/bin/env bash
# Carga los secretos del monitoreo en Coolify y lo despliega.
#
#   bash infra/monitoring/scripts/configure-secrets.sh <uuid-del-recurso-en-coolify>
#
# Lo corre una PERSONA en su terminal: pide el token del bot sin mostrarlo,
# encuentra solo el chat donde le escribieron al bot, genera la clave de
# Grafana, carga todo como variables del recurso en Coolify, manda un mensaje
# de prueba y dispara el despliegue. Ningún secreto queda en el repo ni en el
# historial de la terminal.
#
# Requisitos: curl, python3 y el token de la API de Coolify en
# ~/.config/alovida/coolify.env como COOLIFY_TOKEN='…'.
set -euo pipefail

APP_UUID="${1:?Uso: configure-secrets.sh <uuid-del-recurso-en-coolify>}"
COOLIFY_URL="${COOLIFY_URL:-http://173.249.39.237:8000}"
COOLIFY_ENV_FILE="${COOLIFY_ENV_FILE:-$HOME/.config/alovida/coolify.env}"
GRAFANA_ROOT_URL="${GRAFANA_ROOT_URL:-https://grafana.173.249.39.237.sslip.io}"

COOLIFY_TOKEN="$(sed -n "s/^COOLIFY_TOKEN='\(.*\)'$/\1/p" "$COOLIFY_ENV_FILE")"
[ -n "$COOLIFY_TOKEN" ] || { echo "No encontré COOLIFY_TOKEN en $COOLIFY_ENV_FILE" >&2; exit 1; }

json() { python3 -c "import sys,json; d=json.load(sys.stdin); $1"; }

# --- 1. Token del bot (no se muestra en pantalla) -----------------------------
read -r -s -p "Pegá el token del bot (no se va a ver) y Enter: " BOT_TOKEN; echo
BOT_USERNAME="$(curl -fsS "https://api.telegram.org/bot${BOT_TOKEN}/getMe" | json 'print(d["result"]["username"])')" \
  || { echo "Telegram rechazó ese token. ¿Lo copiaste completo?" >&2; exit 1; }
echo "✔ Token válido: @${BOT_USERNAME}"

# --- 2. Chat destino: el último que le escribió al bot ------------------------
find_chats() {
  curl -fsS "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates" | json '
seen = {}
for u in d.get("result", []):
    msg = u.get("message") or u.get("my_chat_member") or {}
    chat = msg.get("chat") or {}
    if chat.get("id") is not None:
        seen[chat["id"]] = (chat.get("type", "?"), chat.get("title") or chat.get("first_name") or "")
for cid, (kind, title) in seen.items():
    print(f"{cid}\t{kind}\t{title}")'
}

CHATS="$(find_chats)"
while [ -z "$CHATS" ]; do
  echo "El bot todavía no recibió mensajes."
  echo "  → Agregá @${BOT_USERNAME} al grupo y mandá /ayuda@${BOT_USERNAME}"
  echo "    (o escribile /start en privado si querés los avisos sólo para vos)."
  read -r -p "Cuando lo hayas mandado, Enter para reintentar… " _
  CHATS="$(find_chats)"
done

# Prioridad: un grupo antes que un chat privado.
CHAT_LINE="$(printf '%s\n' "$CHATS" | awk -F'\t' '$2 ~ /group/ {print; exit}')"
[ -n "$CHAT_LINE" ] || CHAT_LINE="$(printf '%s\n' "$CHATS" | head -n1)"
CHAT_ID="$(printf '%s' "$CHAT_LINE" | cut -f1)"
echo "✔ Los avisos van a: $(printf '%s' "$CHAT_LINE" | cut -f3) ($(printf '%s' "$CHAT_LINE" | cut -f2), id ${CHAT_ID})"

# --- 3. Healthchecks.io (opcional) y clave de Grafana -------------------------
read -r -p "URL de ping de Healthchecks.io (Enter para saltear por ahora): " HC_URL
# Con python y no `tr </dev/urandom | head`: bajo `pipefail`, el SIGPIPE de tr
# hace fallar la asignación y `set -e` corta el script sin decir nada.
GRAFANA_PASSWORD="$(python3 -c 'import secrets; print(secrets.token_urlsafe(18))')"

# --- 4. Variables en Coolify --------------------------------------------------
PAYLOAD="$(BOT_TOKEN="$BOT_TOKEN" CHAT_ID="$CHAT_ID" HC_URL="$HC_URL" \
  GRAFANA_PASSWORD="$GRAFANA_PASSWORD" GRAFANA_ROOT_URL="$GRAFANA_ROOT_URL" python3 -c '
import json, os
pairs = {
    "TELEGRAM_BOT_TOKEN": os.environ["BOT_TOKEN"],
    "TELEGRAM_CHAT_ID": os.environ["CHAT_ID"],
    "HEALTHCHECKS_PING_URL": os.environ["HC_URL"],
    "GRAFANA_ADMIN_PASSWORD": os.environ["GRAFANA_PASSWORD"],
    "GRAFANA_ROOT_URL": os.environ["GRAFANA_ROOT_URL"],
}
print(json.dumps({"data": [
    {"key": k, "value": v, "is_preview": False, "is_literal": True} for k, v in pairs.items()
]}))')"

curl -fsS -X PATCH "${COOLIFY_URL}/api/v1/applications/${APP_UUID}/envs/bulk" \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}" -H "Content-Type: application/json" \
  -d "$PAYLOAD" >/dev/null
echo "✔ Variables cargadas en Coolify"

# --- 5. Mensaje de prueba y despliegue ----------------------------------------
curl -fsS "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT_ID}" \
  --data-urlencode "text=✅ Bot conectado. En unos minutos llega «Monitoreo del VPS iniciado»." >/dev/null
echo "✔ Mensaje de prueba enviado al chat"

curl -fsS -X POST "${COOLIFY_URL}/api/v1/deploy?uuid=${APP_UUID}" \
  -H "Authorization: Bearer ${COOLIFY_TOKEN}" >/dev/null
echo "✔ Despliegue disparado"

cat <<EOF

Listo. Guardá esta clave de Grafana (no se vuelve a mostrar):
  usuario: admin
  clave:   ${GRAFANA_PASSWORD}
  URL:     ${GRAFANA_ROOT_URL}
EOF
