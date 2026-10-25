#!/bin/bash
# alovida-autodeploy — despliega el último commit de cada rama, desde el servidor.
#
# Reemplaza a los vigilantes launchd de la Mac del propietario, que fallaban
# por tres motivos ajenos al código (medido el 25/10/2026): sólo corrían con la
# Mac encendida; el de test apuntaba a un uuid del servidor viejo (7 818
# intentos con 404 desde el 05/10); y el firewall del panel admite una IP fija
# que la Mac ya no tiene. Acá Coolify está en localhost.
#
# Diferencias con el vigilante de la Mac:
#   - «Desplegado» = el último despliegue FINISHED que registra Coolify, no un
#     archivo propio. Un build que falla no cuenta como desplegado.
#   - No dispara si la app ya tiene un despliegue en cola o en curso: otros
#     (el panel, otras herramientas) también despliegan.
#   - Un sha que falló se reintenta como mucho $MAX_ATTEMPTS veces y avisa por
#     Telegram, en vez de redesplegar en bucle algo que no compila.
#   - Espera $QUIET s de rama quieta (tope $MAX_WAIT) para juntar ráfagas de
#     merges en un solo despliegue.
#
# Uso: alovida-autodeploy.sh [--status]   (lo corre el timer cada 2 min)

set -uo pipefail

CONF="${ALOVIDA_AD_CONF:-/etc/alovida-resilience/autodeploy.conf}"
TOKEN_FILE="${ALOVIDA_AD_TOKEN:-/etc/alovida-resilience/coolify.token}"
STATE="${ALOVIDA_AD_STATE:-/var/lib/alovida-resilience/autodeploy}"
LOG="${ALOVIDA_AD_LOG:-/var/log/alovida-autodeploy.log}"
TELEGRAM_ENV="${ALOVIDA_TELEGRAM_ENV:-/opt/alovida-monitoring/.env}"
COOLIFY="http://localhost:8000/api/v1"
QUIET="${QUIET:-600}"
MAX_WAIT="${MAX_WAIT:-1800}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-2}"

mkdir -p "$STATE"; chmod 700 "$STATE"

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*" >>"$LOG"; printf '%s\n' "$*"; }

notify() {
  local token chat
  [ -f "$TELEGRAM_ENV" ] || return 0
  token="$(sed -n 's/^TELEGRAM_BOT_TOKEN=//p' "$TELEGRAM_ENV" | tr -d "'\"")"
  chat="$(sed -n 's/^TELEGRAM_CHAT_ID=//p' "$TELEGRAM_ENV" | tr -d "'\"")"
  [ -n "$token" ] && [ -n "$chat" ] || return 0
  # La URL lleva el token: va por la config en stdin, no por argv (lo vería `ps`).
  printf 'url = "https://api.telegram.org/bot%s/sendMessage"\n' "$token" |
    curl -s -m 15 -o /dev/null -K - --data-urlencode "chat_id=$chat" --data-urlencode "text=$1" || true
}

db() { docker exec coolify-db psql -U coolify -d coolify -tAc "$1" 2>/dev/null; }

app_id() { db "select id from applications where uuid='$1'"; }

last_finished_sha() {
  db "select commit from application_deployment_queues where application_id='$1' and status='finished' and commit <> 'HEAD' order by id desc limit 1"
}

busy() {
  [ "$(db "select count(*) from application_deployment_queues where application_id='$1' and status in ('queued','in_progress')")" != "0" ]
}

failed_attempts() {
  db "select count(*) from application_deployment_queues where application_id='$1' and commit='$2' and status='failed'"
}

branch_sha() {
  GIT_TERMINAL_PROMPT=0 timeout 30 git ls-remote "https://github.com/$1.git" "refs/heads/$2" 2>/dev/null | awk '{print $1}'
}

deploy() {
  local uuid="$1" token
  token="$(cat "$TOKEN_FILE")"
  # El token va por la config en stdin, no por argv (lo vería `ps`).
  printf 'header = "Authorization: Bearer %s"\n' "$token" |
    curl -s -m 60 -K - -X POST "$COOLIFY/deploy?uuid=$uuid&force=false"
}

one_app() {
  local name="$1" uuid="$2" repo="$3" branch="$4"
  local id sha done_sha cand seen first now quiet waited tries
  [ -f "$STATE/$name.disabled" ] && return 0
  id="$(app_id "$uuid")"
  [ -n "$id" ] || { log "$name: ERROR la app $uuid no existe en Coolify"; return 1; }
  sha="$(branch_sha "$repo" "$branch")"
  [ -n "$sha" ] || { log "$name: ERROR no se pudo leer $repo@$branch"; return 1; }
  done_sha="$(last_finished_sha "$id")"

  if [ "$sha" = "$done_sha" ]; then
    rm -f "$STATE/$name".{candidate,seen,first,alerted}
    return 0
  fi

  now="$(date +%s)"
  [ -f "$STATE/$name.first" ] || echo "$now" >"$STATE/$name.first"
  cand="$(cat "$STATE/$name.candidate" 2>/dev/null)"
  if [ "$sha" != "$cand" ]; then
    echo "$sha" >"$STATE/$name.candidate"; echo "$now" >"$STATE/$name.seen"
    log "$name: $branch avanzó a ${sha:0:8} (desplegado ${done_sha:0:8}); espero ${QUIET}s de quietud"
    return 0
  fi
  seen="$(cat "$STATE/$name.seen")"; first="$(cat "$STATE/$name.first")"
  quiet=$((now - seen)); waited=$((now - first))
  [ "$quiet" -ge "$QUIET" ] || [ "$waited" -ge "$MAX_WAIT" ] || return 0

  if busy "$id"; then return 0; fi   # ya hay un despliegue en marcha: esperar a que termine

  tries="$(failed_attempts "$id" "$sha")"
  if [ "${tries:-0}" -ge "$MAX_ATTEMPTS" ]; then
    if [ ! -f "$STATE/$name.alerted" ] || [ "$(cat "$STATE/$name.alerted")" != "$sha" ]; then
      log "$name: ${sha:0:8} falló $tries veces; NO se reintenta. Sigue sirviendo ${done_sha:0:8}"
      notify "⚠️ AloVida $name: el despliegue de ${sha:0:8} ($branch) falló $tries veces. Se sigue sirviendo la versión ${done_sha:0:8}. Revisar el log en Coolify."
      echo "$sha" >"$STATE/$name.alerted"
    fi
    return 0
  fi

  log "$name: desplegando ${sha:0:8} (quieto ${quiet}s, intento $((tries + 1))): $(deploy "$uuid" | head -c 160)"
}

status() {
  local name uuid repo branch id
  while read -r name uuid repo branch; do
    case "$name" in ''|'#'*) continue ;; esac
    id="$(app_id "$uuid")"
    printf '%-11s %-7s rama=%.8s desplegado=%.8s %s%s\n' "$name" "$branch" "$(branch_sha "$repo" "$branch")" \
      "$(last_finished_sha "$id")" "$(busy "$id" && echo '[desplegando] ')" "$( [ -f "$STATE/$name.disabled" ] && echo DESHABILITADA)"
  done <"$CONF"
}

[ "${1:-}" = "--status" ] && { status; exit 0; }

[ -r "$TOKEN_FILE" ] || { log "ERROR: falta $TOKEN_FILE"; exit 1; }
exec 9>"$STATE/.lock"; flock -n 9 || exit 0
while read -r name uuid repo branch; do
  case "$name" in ''|'#'*) continue ;; esac
  one_app "$name" "$uuid" "$repo" "$branch"
done <"$CONF"
