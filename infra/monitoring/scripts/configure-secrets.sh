#!/usr/bin/env bash
# Carga los secretos del monitoreo en Coolify y lo despliega.
#
#   COOLIFY_URL=https://coolify.ejemplo.org \
#     bash infra/monitoring/scripts/configure-secrets.sh <uuid-del-recurso-en-coolify>
#
# Lo corre una PERSONA en su terminal: pide el token del bot sin mostrarlo,
# encuentra solo el chat donde le escribieron al bot, genera la clave de
# Grafana, carga todo como variables del recurso en Coolify, manda un mensaje
# de prueba y dispara el despliegue. Ningún secreto queda en el repo ni en el
# historial de la terminal.
#
# Requisitos: curl, python3 y el token de la API de Coolify en
# ~/.config/alovida/coolify.env como COOLIFY_TOKEN='…'.
#
# IC-01 · el token administrador de Coolify y los secretos de monitoreo:
#   - COOLIFY_URL es OBLIGATORIA y debe ser https://. HTTP sólo se acepta hacia
#     loopback (localhost, 127.0.0.1, [::1]), es decir un túnel SSH local; hacia
#     cualquier otro host el script se niega, porque el token viajaría en claro.
#   - Ningún secreto va en los argumentos de un proceso (`ps` los mostraría): la
#     URL, el encabezado Authorization y el cuerpo se entregan a curl por su
#     archivo de configuración leído de stdin (-K -), y el JSON de variables
#     viaja por un archivo temporal 0600 que se borra al salir.
#   - Si este flujo ya corrió contra un http:// remoto, rotá el token de Coolify,
#     el del bot de Telegram y la clave de Grafana.
#   Prueba sin tocar Coolify ni Telegram: bash infra/monitoring/scripts/tests/configure-secrets.test.sh
set -euo pipefail

# Devuelve 0 si la URL es https:// o http:// hacia loopback; 1 en cualquier otro caso.
validate_coolify_url() {
  local url="$1" rest authority host
  case "$url" in
    https://?*) rest="${url#https://}" ;;
    http://?*)  rest="${url#http://}" ;;
    *) return 1 ;;
  esac
  authority="${rest%%/*}"
  # Sin credenciales embebidas: `http://localhost:80@otro-host` es otro host.
  case "$authority" in *@*|"") return 1 ;; esac
  if [ "${url%%:*}" = "https" ]; then
    return 0
  fi
  case "$authority" in
    \[::1\]|\[::1\]:*) host="[::1]" ;;
    *) host="${authority%%:*}" ;;
  esac
  case "$host" in
    localhost|127.0.0.1|"[::1]") return 0 ;;
    *) return 1 ;;
  esac
}

# Permite cargar las funciones sin ejecutar el flujo (lo usa la prueba).
if [ "${CONFIGURE_SECRETS_SOURCE_ONLY:-}" = "1" ]; then
  return 0 2>/dev/null || exit 0
fi

APP_UUID="${1:?Uso: configure-secrets.sh <uuid-del-recurso-en-coolify>}"
COOLIFY_URL="${COOLIFY_URL:-}"
[ -n "$COOLIFY_URL" ] || {
  echo "Falta COOLIFY_URL (por ejemplo https://coolify.ejemplo.org). Ya no hay valor por defecto." >&2
  exit 1
}
COOLIFY_URL="${COOLIFY_URL%/}"
validate_coolify_url "$COOLIFY_URL" || {
  echo "COOLIFY_URL debe ser https://, o http:// sólo hacia localhost/127.0.0.1/[::1] (túnel SSH)." >&2
  echo "Con otro host http:// el token administrador viajaría en claro." >&2
  exit 1
}
COOLIFY_ENV_FILE="${COOLIFY_ENV_FILE:-$HOME/.config/alovida/coolify.env}"
GRAFANA_ROOT_URL="${GRAFANA_ROOT_URL:-https://grafana.173.249.39.237.sslip.io}"

COOLIFY_TOKEN="$(sed -n "s/^COOLIFY_TOKEN='\(.*\)'$/\1/p" "$COOLIFY_ENV_FILE")"
[ -n "$COOLIFY_TOKEN" ] || { echo "No encontré COOLIFY_TOKEN en $COOLIFY_ENV_FILE" >&2; exit 1; }

json() { python3 -c "import sys,json; d=json.load(sys.stdin); $1"; }

PAYLOAD_FILE="$(umask 077; mktemp)"
trap 'rm -f "$PAYLOAD_FILE"' EXIT

# Escapa un valor para un archivo de configuración de curl (entre comillas dobles).
cfg_escape() { local v="$1"; v="${v//\\/\\\\}"; v="${v//\"/\\\"}"; printf '%s' "$v"; }

# curl con la configuración por stdin: `printf` es un builtin, así que ni la URL
# ni los encabezados ni el cuerpo aparecen en los argumentos de ningún proceso.
curl_secure() { printf '%s\n' "$@" | curl -fsS -K -; }

# Llamada autenticada a la API de Coolify: coolify_call MÉTODO /ruta [archivo-con-cuerpo]
coolify_call() {
  local method="$1" path="$2" body_file="${3:-}"
  local cfg=(
    "url = \"$(cfg_escape "${COOLIFY_URL}${path}")\""
    "request = \"${method}\""
    "header = \"Authorization: Bearer $(cfg_escape "$COOLIFY_TOKEN")\""
    'header = "Content-Type: application/json"'
  )
  [ -z "$body_file" ] || cfg+=("data = \"@$(cfg_escape "$body_file")\"")
  curl_secure "${cfg[@]}"
}

# Llamada a la API del bot: telegram_call método [clave=valor ...]
telegram_call() {
  local method="$1"; shift
  local cfg=("url = \"https://api.telegram.org/bot$(cfg_escape "$BOT_TOKEN")/${method}\"")
  local pair
  for pair in "$@"; do cfg+=("data-urlencode = \"$(cfg_escape "$pair")\""); done
  curl_secure "${cfg[@]}"
}

# --- 1. Token del bot (no se muestra en pantalla) -----------------------------
read -r -s -p "Pegá el token del bot (no se va a ver) y Enter: " BOT_TOKEN; echo
BOT_USERNAME="$(telegram_call getMe | json 'print(d["result"]["username"])')" \
  || { echo "Telegram rechazó ese token. ¿Lo copiaste completo?" >&2; exit 1; }
echo "✔ Token válido: @${BOT_USERNAME}"

# --- 2. Chat destino: el último que le escribió al bot ------------------------
find_chats() {
  telegram_call getUpdates | json '
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
BOT_TOKEN="$BOT_TOKEN" CHAT_ID="$CHAT_ID" HC_URL="$HC_URL" \
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
]}))' >"$PAYLOAD_FILE"

coolify_call PATCH "/api/v1/applications/${APP_UUID}/envs/bulk" "$PAYLOAD_FILE" >/dev/null
rm -f "$PAYLOAD_FILE"
echo "✔ Variables cargadas en Coolify"

# --- 5. Mensaje de prueba y despliegue ----------------------------------------
telegram_call sendMessage "chat_id=${CHAT_ID}" \
  "text=✅ Bot conectado. En unos minutos llega «Monitoreo del VPS iniciado»." >/dev/null
echo "✔ Mensaje de prueba enviado al chat"

coolify_call POST "/api/v1/deploy?uuid=${APP_UUID}" >/dev/null
echo "✔ Despliegue disparado"

cat <<EOF

Listo. Guardá esta clave de Grafana (no se vuelve a mostrar):
  usuario: admin
  clave:   ${GRAFANA_PASSWORD}
  URL:     ${GRAFANA_ROOT_URL}
EOF
