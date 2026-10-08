#!/usr/bin/env bash
# Instala (o actualiza) el monitoreo DIRECTO en un servidor, sin pasar por Coolify.
#
#   bash infra/monitoring/scripts/install-on-host.sh 62.169.18.132
#
# Por qué fuera de Coolify: el monitoreo tiene que seguir vivo y avisando
# cuando Coolify o las apps fallan. Corre como un proyecto de Docker Compose
# en /opt/alovida-monitoring, con `restart: always`.
#
# Lo corre una PERSONA: pide el token del bot sin mostrarlo, encuentra el chat,
# genera la clave de Grafana y la escribe en el .env del servidor (permisos 600).
# Ningún secreto queda en el repo, en el historial ni en el chat.
#
# Requisitos: llave SSH que entre como root (SSH_KEY), curl y python3 locales.
set -euo pipefail

HOST="${1:?Uso: install-on-host.sh <ip-del-servidor>}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/alovida_contabo}"
REPO_URL="${REPO_URL:-https://github.com/mdavila-2001/mantra-core-health-api.git}"
BRANCH="${BRANCH:-test}"
REMOTE_DIR=/opt/alovida-monitoring
STACK_DIR="$REMOTE_DIR/infra/monitoring"

remote() { ssh -i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=15 "root@$HOST" "$@"; }
json() { python3 -c "import sys,json; d=json.load(sys.stdin); $1"; }

echo "▶ Comprobando acceso a root@$HOST…"
remote true || { echo "✖ La llave $SSH_KEY no entra a $HOST." >&2; exit 1; }

# --- 1. Código en el servidor (sólo infra/monitoring, clon liviano) ----------
echo "▶ Bajando infra/monitoring (rama $BRANCH) en $REMOTE_DIR…"
remote "set -e
if [ ! -d $REMOTE_DIR/.git ]; then
  git clone -q --depth 1 --filter=blob:none --sparse --branch $BRANCH $REPO_URL $REMOTE_DIR
  git -C $REMOTE_DIR sparse-checkout set infra/monitoring
else
  git -C $REMOTE_DIR fetch -q --depth 1 origin $BRANCH
  git -C $REMOTE_DIR checkout -q -B $BRANCH FETCH_HEAD
fi
git -C $REMOTE_DIR log -1 --format='   commit %h · %s'"

# --- 2. Token del bot (se lee de la terminal, no se ve) ----------------------
read -r -s -p "Pegá el token del bot de Telegram (no se va a ver) y Enter: " BOT_TOKEN </dev/tty; echo
BOT_USERNAME="$(curl -fsS "https://api.telegram.org/bot${BOT_TOKEN}/getMe" | json 'print(d["result"]["username"])')" \
  || { echo "✖ Telegram rechazó ese token. ¿Lo copiaste completo?" >&2; exit 1; }
echo "✔ Token válido: @${BOT_USERNAME}"

# El bot viejo puede estar haciendo long polling con este mismo token: sin
# esto, getUpdates del instalador compite con él y no ve ningún mensaje.
remote "cd $STACK_DIR 2>/dev/null && docker compose -p alovida-monitoring stop telegram-bot >/dev/null 2>&1 || true"

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
  echo "  → Escribile /start a @${BOT_USERNAME} en Telegram (o agregalo a un grupo y mandá /ayuda@${BOT_USERNAME})."
  read -r -p "Cuando lo hayas mandado, Enter para reintentar… " _ </dev/tty
  CHATS="$(find_chats)"
done
CHAT_LINE="$(printf '%s\n' "$CHATS" | awk -F'\t' '$2 ~ /group/ {print; exit}')"
[ -n "$CHAT_LINE" ] || CHAT_LINE="$(printf '%s\n' "$CHATS" | head -n1)"
CHAT_ID="$(printf '%s' "$CHAT_LINE" | cut -f1)"
echo "✔ Los avisos van a: $(printf '%s' "$CHAT_LINE" | cut -f3) ($(printf '%s' "$CHAT_LINE" | cut -f2))"

read -r -p "URL de ping de Healthchecks.io (Enter para saltear): " HC_URL </dev/tty
GRAFANA_PASSWORD="$(python3 -c 'import secrets; print(secrets.token_urlsafe(18))')"

# --- 3. .env en el servidor (por stdin: nada viaja en la línea de comandos) ---
printf '%s\n' \
  "TELEGRAM_BOT_TOKEN=${BOT_TOKEN}" \
  "TELEGRAM_CHAT_ID=${CHAT_ID}" \
  "HEALTHCHECKS_PING_URL=${HC_URL}" \
  "GRAFANA_ADMIN_PASSWORD=${GRAFANA_PASSWORD}" \
  "GRAFANA_ROOT_URL=http://localhost:3000" \
  | remote "umask 077; cat > $STACK_DIR/.env"
echo "✔ Secretos guardados en $STACK_DIR/.env (sólo root puede leerlo)"

# --- 4. Levantar ---------------------------------------------------------------
echo "▶ Construyendo y levantando el monitoreo (unos minutos la primera vez)…"
remote "cd $STACK_DIR && docker compose -p alovida-monitoring up -d --build --remove-orphans 2>&1 | tail -5"

curl -fsS "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT_ID}" \
  --data-urlencode "text=✅ Bot conectado al servidor ${HOST}. En un minuto llega «Monitoreo del VPS iniciado». Probá /status y /graficas." >/dev/null

cat <<EOF

Listo. Guardá la clave de Grafana (no se vuelve a mostrar):
  usuario: admin
  clave:   ${GRAFANA_PASSWORD}
Para entrar a Grafana, abrí un túnel y andá a http://localhost:3000 :
  ssh -i ${SSH_KEY} -L 3000:127.0.0.1:3000 root@${HOST}
EOF
