#!/bin/bash
# alovida-standby — «la versión vieja sigue sirviendo hasta que la nueva esté sana».
#
# Coolify despliega los fronts como docker-compose: construye con la versión
# vieja en pie y, al final, BORRA los contenedores viejos y recién entonces
# arranca los nuevos. Medido el 25/10/2026: ~1 min sin nada que responda en
# cada despliegue, y sin límite si el contenedor nuevo no arranca (el proxy de
# dev quedó en bucle con «duplicate location» y Coolify informó «finished»).
# Traefik responde entonces «no available server».
#
# Este reconciliador corre cada pocos segundos y, por cada app de apps.conf:
#
#   1. Le pone al contenedor VIVO de Coolify un alias estable
#      (`alovida-live-<app>`) en la red de borde ($EDGE_NET), que sólo comparten
#      Traefik y estos contenedores. Coolify cambia el nombre del contenedor en
#      cada despliegue; el alias no.
#   2. Mantiene un STANDBY: copia del vivo (misma imagen por id, mismo entorno)
#      llamada `alovida-standby-<app>`. Sólo se renueva cuando el vivo lleva
#      $MIN_HEALTHY_SECONDS sano, así que durante un despliegue el standby
#      sigue siendo la versión anterior.
#
# Traefik (alovida-failover.yaml) manda el tráfico al vivo y, si su healthcheck
# falla, al standby. Resultado: durante el cambio se ve la versión anterior;
# si la nueva no arranca nunca, se sigue viendo la anterior.
#
# Modos:
#   single — la app es un solo contenedor `web` (la demo de mockup).
#   pair   — `proxy` (nginx) delante de `web` (test, dev). El standby es un par
#            proxy+web en una red privada donde el único `web` es el standby; el
#            `api` vivo se conecta a esa red para que el standby llegue a la API.
#
# Uso:  alovida-standby.sh            una pasada
#       alovida-standby.sh --loop     cada $INTERVAL s (lo que corre systemd)
#       alovida-standby.sh --status   estado por app

set -uo pipefail

CONF="${ALOVIDA_HA_CONF:-/etc/alovida-resilience/apps.conf}"
STATE="${ALOVIDA_HA_STATE:-/var/lib/alovida-resilience}"
LOG="${ALOVIDA_HA_LOG:-/var/log/alovida-resilience.log}"
# Red de borde: una a la que Traefik YA está conectado y sin alias `web`/`api`
# (si los tuviera, el nginx de un proxy conectado ahí podría resolver la API de
# otro entorno). `alovida-mockup` sólo tiene a Traefik. No se crea una red
# nueva porque `docker network connect` sobre coolify-proxy falla (le falta su
# resolv.conf interno, 25/10/2026): conectarlo exigiría recrear Traefik.
EDGE_NET="${ALOVIDA_HA_EDGE_NET:-alovida-mockup}"
MIN_HEALTHY_SECONDS="${MIN_HEALTHY_SECONDS:-120}"
STANDBY_READY_TIMEOUT="${STANDBY_READY_TIMEOUT:-180}"
INTERVAL="${INTERVAL:-5}"

mkdir -p "$STATE"
chmod 700 "$STATE"

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*" >>"$LOG"; }

# --- redes ------------------------------------------------------------------

ensure_network() {
  docker network inspect "$1" >/dev/null 2>&1 || {
    docker network create "$1" >/dev/null && log "red $1 creada"
  }
}

# Conecta $2 a la red $1 con el alias $3, si no lo tiene ya.
ensure_attached() {
  local net="$1" container="$2" alias="${3:-}" aliases
  aliases="$(docker inspect -f "{{with index .NetworkSettings.Networks \"$net\"}}{{.Aliases}}{{else}}NO{{end}}" "$container" 2>/dev/null)" || return 1
  if [ "$aliases" = "NO" ]; then
    if [ -n "$alias" ]; then
      docker network connect --alias "$alias" "$net" "$container" >/dev/null 2>&1
    else
      docker network connect "$net" "$container" >/dev/null 2>&1
    fi && log "conectado $container a $net ${alias:+(alias $alias)}"
    return
  fi
  if [ -n "$alias" ] && ! grep -qw -- "$alias" <<<"$aliases"; then
    # Conectado sin el alias (p. ej. lo reconectó otra herramienta): reconectar.
    docker network disconnect "$net" "$container" >/dev/null 2>&1
    docker network connect --alias "$alias" "$net" "$container" >/dev/null 2>&1 &&
      log "reconectado $container a $net con alias $alias"
  fi
}

# --- contenedores -----------------------------------------------------------

# Contenedor vivo más reciente de un servicio de Coolify: <svc>-<uuid>-<fecha>.
live_container() {
  docker ps --filter "name=^$1-$2-" --format '{{.Names}}' | sort | tail -1
}

health_of() { docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$1" 2>/dev/null; }

healthy_for_seconds() {
  local started
  [ "$(health_of "$1")" = "healthy" ] || { echo 0; return; }
  started="$(docker inspect -f '{{.State.StartedAt}}' "$1" 2>/dev/null)" || { echo 0; return; }
  echo $(( $(date +%s) - $(date -d "$started" +%s) ))
}

image_id() { docker inspect -f '{{.Image}}' "$1" 2>/dev/null; }

# Copia el entorno del vivo a un archivo 600. Fuera las variables que describen
# al contenedor de Coolify y no a la app.
write_env_file() {
  local src="$1" dest="$2"
  ( umask 077
    docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$src" |
      grep -vE '^(PATH|HOSTNAME|HOME|COOLIFY_CONTAINER_NAME)=' | grep -v '^$' >"$dest" )
}

health_cmd_of() {
  docker inspect -f '{{if .Config.Healthcheck}}{{range $i, $t := .Config.Healthcheck.Test}}{{if eq $i 1}}{{$t}}{{end}}{{end}}{{end}}' "$1"
}

# Arranca $name desde la imagen y el entorno de $src, en $net con $alias.
# Si ya existía, levanta el nuevo con otro nombre, espera a que esté sano y
# recién entonces retira el viejo: el standby nunca queda vacío.
replace_from() {
  local src="$1" name="$2" net="$3" alias="$4" mem="$5"
  local img envf hc tmp="$2-next" waited=0
  img="$(image_id "$src")"
  envf="$STATE/$name.env"
  write_env_file "$src" "$envf"
  hc="$(health_cmd_of "$src")"

  docker rm -f "$tmp" >/dev/null 2>&1
  docker run -d --name "$tmp" \
    --restart unless-stopped --memory "$mem" \
    --label "alovida.standby=$name" --label "alovida.standby.source=$src" \
    --env-file "$envf" \
    --network "$net" --network-alias "$alias" \
    ${hc:+--health-cmd "$hc" --health-interval 10s --health-timeout 5s --health-retries 3 --health-start-period 30s} \
    "$img" >/dev/null || { log "ERROR: no arrancó $tmp desde $src"; return 1; }

  until [ "$(health_of "$tmp")" = "healthy" ]; do
    sleep 3; waited=$((waited + 3))
    if [ "$waited" -ge "$STANDBY_READY_TIMEOUT" ]; then
      log "ERROR: $tmp no quedó sano en ${STANDBY_READY_TIMEOUT}s; se conserva el standby anterior"
      docker rm -f "$tmp" >/dev/null 2>&1
      return 1
    fi
  done
  docker rm -f "$name" >/dev/null 2>&1
  docker rename "$tmp" "$name"
  log "standby $name renovado desde $src (imagen ${img:7:12})"
}

# --- una app ----------------------------------------------------------------

reconcile_single() {
  local app="$1" uuid="$2" live standby="alovida-standby-$1"
  docker inspect "$standby" >/dev/null 2>&1 && ensure_attached "$EDGE_NET" "$standby" "$standby"
  live="$(live_container web "$uuid")"
  [ -n "$live" ] || return 0   # despliegue en curso o app parada: Traefik usa el standby
  ensure_attached "$EDGE_NET" "$live" "alovida-live-$app"

  [ "$(healthy_for_seconds "$live")" -ge "$MIN_HEALTHY_SECONDS" ] || return 0
  [ "$(image_id "$live")" = "$(image_id "$standby")" ] && return 0
  replace_from "$live" "$standby" "$EDGE_NET" "$standby" 768m
}

reconcile_pair() {
  local app="$1" uuid="$2" api_prefix="$3"
  local proxy web api standby="alovida-standby-$1" net="alovida-standby-$1"
  proxy="$(live_container proxy "$uuid")"
  web="$(live_container web "$uuid")"

  ensure_network "$net"
  # El standby llega a la API viva por su propia red.
  api="$(docker ps --filter "name=^$api_prefix" --format '{{.Names}}' | sort | tail -1)"
  [ -n "$api" ] && ensure_attached "$net" "$api" api

  [ -n "$proxy" ] || return 0
  ensure_attached "$EDGE_NET" "$proxy" "alovida-live-$app"

  [ -n "$web" ] || return 0
  [ "$(healthy_for_seconds "$proxy")" -ge "$MIN_HEALTHY_SECONDS" ] || return 0
  [ "$(healthy_for_seconds "$web")" -ge "$MIN_HEALTHY_SECONDS" ] || return 0
  if [ "$(image_id "$web")" != "$(image_id "$standby-web")" ]; then
    replace_from "$web" "$standby-web" "$net" web 768m || return 0
  fi
  if [ "$(image_id "$proxy")" != "$(image_id "$standby")" ]; then
    replace_from "$proxy" "$standby" "$net" "$standby" 128m || return 0
  fi
}

pass() {
  docker network inspect "$EDGE_NET" >/dev/null 2>&1 || { log "ERROR: no existe la red de borde $EDGE_NET"; return 1; }
  local app uuid mode api_uuid
  while read -r app uuid mode api_uuid; do
    case "$app" in ''|'#'*) continue ;; esac
    [ -f "$STATE/$app.disabled" ] && continue
    case "$mode" in
      single) reconcile_single "$app" "$uuid" ;;
      pair) reconcile_pair "$app" "$uuid" "$api_uuid" ;;  # 4.º campo: prefijo del contenedor de API
      *) log "ERROR: modo desconocido «$mode» para $app" ;;
    esac
  done <"$CONF"
  # Los standby del par llegan a Traefik por la red de borde.
  while read -r app uuid mode _; do
    case "$app" in ''|'#'*) continue ;; esac
    [ "$mode" = "pair" ] && docker inspect "alovida-standby-$app" >/dev/null 2>&1 &&
      ensure_attached "$EDGE_NET" "alovida-standby-$app" "alovida-standby-$app"
  done <"$CONF"
}

status() {
  local app uuid mode api_uuid live
  while read -r app uuid mode api_uuid; do
    case "$app" in ''|'#'*) continue ;; esac
    if [ "$mode" = "single" ]; then live="$(live_container web "$uuid")"; else live="$(live_container proxy "$uuid")"; fi
    printf '%-8s vivo=%-48s %-9s img=%-12s | standby=%-9s img=%-12s %s\n' "$app" \
      "${live:-(ninguno)}" "$( [ -n "$live" ] && health_of "$live")" "$( [ -n "$live" ] && image_id "$live" | cut -c8-19)" \
      "$(health_of "alovida-standby-$app" || echo '-')" "$(image_id "alovida-standby-$app" | cut -c8-19)" \
      "$( [ -f "$STATE/$app.disabled" ] && echo DESHABILITADA)"
  done <"$CONF"
}

case "${1:-}" in
  --status) status ;;
  --loop) while true; do pass; sleep "$INTERVAL"; done ;;
  *) pass ;;
esac
