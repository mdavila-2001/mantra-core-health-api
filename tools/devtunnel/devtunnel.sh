#!/usr/bin/env bash
# Supervisor del túnel de desarrollo + auto-fetch + relanzado de imágenes Docker.
#
# ## Qué resuelve
#
# El túnel se caía —`cloudflared` quedaba en bucle de reintento contra el borde—
# y desde ahí no volvía solo. Y cada vez que alguien lo reiniciaba a mano, el
# enlace cambiaba: con un *quick tunnel* de `trycloudflare` el hostname es
# aleatorio y se sortea de nuevo en cada arranque del proceso.
#
# ## La regla que hace que el enlace no cambie
#
# **Este script no reinicia `cloudflared` salvo que el proceso esté muerto.**
# El túnel apunta a un puerto local fijo, así que reconstruir y relanzar los
# contenedores que están detrás **no toca el enlace**: la URL sobrevive a
# cualquier cantidad de despliegues. Lo único que la cambia es que muera el
# propio `cloudflared`, y en ese caso el script lo levanta de nuevo y deja la
# URL nueva en `URL_ACTUAL` (y avisa en el log que cambió).
#
# Un enlace verdaderamente permanente exige un *named tunnel*, que necesita
# `cloudflared tunnel login` (navegador) y un dominio en la cuenta de
# Cloudflare. Mientras no lo haya, esto es lo más estable posible.
#
# ## Uso
#
#   tools/devtunnel/devtunnel.sh            # supervisa en primer plano
#   nohup tools/devtunnel/devtunnel.sh &    # o en segundo plano
#   cat tools/devtunnel/estado/URL_ACTUAL   # el enlace vigente
#
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKSPACE="$(cd "$RAIZ/.." && pwd)"
ESTADO="$RAIZ/tools/devtunnel/estado"
mkdir -p "$ESTADO"

PUERTO="${DEVTUNNEL_PORT:-4200}"
INTERVALO="${DEVTUNNEL_INTERVAL:-120}"      # cada cuánto se comprueba todo
CLOUDFLARED="${CLOUDFLARED_BIN:-$HOME/.local/bin/cloudflared}"

URL_FILE="$ESTADO/URL_ACTUAL"
TUNNEL_LOG="$ESTADO/cloudflared.log"
PID_FILE="$ESTADO/cloudflared.pid"
LOG="$ESTADO/devtunnel.log"

# Repos que se vigilan y, si hay cambios, se despliegan.
REPOS=("$WORKSPACE/mantra-core-health-api" "$WORKSPACE/mantra-core-health")

log() { printf '%s | %s\n' "$(date -Is)" "$*" | tee -a "$LOG"; }

# --- Túnel ---------------------------------------------------------------

tunel_vivo() {
  local pid
  [ -f "$PID_FILE" ] || return 1
  pid="$(cat "$PID_FILE" 2>/dev/null)" || return 1
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

# Arranca el túnel y publica su URL. Sólo se llama si no hay uno vivo.
arrancar_tunel() {
  local anterior=""
  [ -f "$URL_FILE" ] && anterior="$(cat "$URL_FILE")"

  : > "$TUNNEL_LOG"
  setsid nohup "$CLOUDFLARED" tunnel --url "http://localhost:$PUERTO" \
    --no-autoupdate >>"$TUNNEL_LOG" 2>&1 < /dev/null &
  echo $! > "$PID_FILE"

  # La URL tarda unos segundos en aparecer en el log.
  local url="" i
  for i in $(seq 1 30); do
    url="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -1)"
    [ -n "$url" ] && break
    sleep 1
  done

  if [ -z "$url" ]; then
    log "TÚNEL: arrancó pero no publicó URL todavía; se reintenta en el próximo ciclo"
    return 1
  fi

  echo "$url" > "$URL_FILE"
  if [ -n "$anterior" ] && [ "$anterior" != "$url" ]; then
    log "TÚNEL: ⚠ el enlace CAMBIÓ (el proceso anterior había muerto)"
    log "TÚNEL:   antes: $anterior"
    log "TÚNEL:   ahora: $url"
  else
    log "TÚNEL: arriba en $url  (→ localhost:$PUERTO)"
  fi
}

# El proceso puede estar vivo y aun así no servir: `cloudflared` se queda en
# bucle de reintento contra el borde y desde afuera responde 000. Por eso se
# comprueba la URL, no sólo el PID — que era justo el modo en que se caía sin
# que nadie se enterara.
tunel_responde() {
  local url
  [ -f "$URL_FILE" ] || return 1
  url="$(cat "$URL_FILE")"
  [ -n "$url" ] || return 1
  local codigo
  codigo="$(curl -s -o /dev/null -w '%{http_code}' -m 20 "$url/" || echo 000)"
  [ "$codigo" != "000" ]
}

# --- Despliegue ----------------------------------------------------------

# Reconstruye y relanza los contenedores del repo indicado. NO toca el túnel.
desplegar() {
  local repo="$1" nombre
  nombre="$(basename "$repo")"

  if [ "$nombre" = "mantra-core-health-api" ]; then
    log "DESPLIEGUE[$nombre]: construyendo imagen…"
    ( cd "$repo" && GIT_COMMIT="$(git rev-parse HEAD)" BUILD_TIME="$(date -Iseconds)" \
        docker compose build api ) >>"$LOG" 2>&1 || {
      log "DESPLIEGUE[$nombre]: ✗ falló la construcción; se conserva la imagen anterior"
      return 1
    }
    # `--no-deps`: `postgres-init` no puede completar en esta máquina (faltan
    # las carpetas 58/59 del DDL) y la base ya está provisionada.
    ( cd "$repo" && GIT_COMMIT="$(git rev-parse HEAD)" BUILD_TIME="$(date -Iseconds)" \
        docker compose up -d --no-deps api worker-community ) >>"$LOG" 2>&1 || {
      log "DESPLIEGUE[$nombre]: ✗ falló el relanzado"
      return 1
    }
    log "DESPLIEGUE[$nombre]: ✓ api y worker-community relanzados"
  else
    # El front corre en modo dev con recarga en caliente: recompila solo, y
    # reiniciarlo cortaría las sesiones abiertas sin ganar nada.
    log "DESPLIEGUE[$nombre]: recarga en caliente, no hace falta relanzar"
  fi
}

# --- Auto-fetch ----------------------------------------------------------

# Trae la rama de seguimiento y despliega si de verdad se movió.
revisar_repo() {
  local repo="$1" nombre rama antes despues
  nombre="$(basename "$repo")"
  [ -d "$repo/.git" ] || return 0

  rama="$(git -C "$repo" rev-parse --abbrev-ref HEAD 2>/dev/null)" || return 0
  git -C "$repo" fetch --quiet origin 2>/dev/null || {
    log "FETCH[$nombre]: sin red o sin remoto; se reintenta"
    return 0
  }

  git -C "$repo" rev-parse --verify --quiet "origin/$rama" >/dev/null || return 0

  antes="$(git -C "$repo" rev-parse HEAD)"
  despues="$(git -C "$repo" rev-parse "origin/$rama")"
  [ "$antes" = "$despues" ] && return 0

  # Con cambios locales sin guardar no se toca nada: un `pull` acá se los
  # llevaría por delante, y perder trabajo es peor que quedarse desactualizado.
  if [ -n "$(git -C "$repo" status --porcelain)" ]; then
    log "FETCH[$nombre]: hay $rama nueva en el remoto pero el árbol tiene cambios sin guardar; NO se toca"
    return 0
  fi

  log "FETCH[$nombre]: $rama avanzó ${antes:0:8} → ${despues:0:8}; actualizando"
  git -C "$repo" merge --ff-only "origin/$rama" >>"$LOG" 2>&1 || {
    log "FETCH[$nombre]: ✗ no avanza con fast-forward (divergió); se deja como está"
    return 0
  }
  desplegar "$repo"
}

# --- Bucle ---------------------------------------------------------------

log "=== supervisor arriba · puerto $PUERTO · cada ${INTERVALO}s ==="
trap 'log "=== supervisor detenido ==="; exit 0' INT TERM

while true; do
  if ! tunel_vivo; then
    log "TÚNEL: no hay proceso vivo; arrancando"
    arrancar_tunel
  elif ! tunel_responde; then
    log "TÚNEL: el proceso vive pero la URL no responde (bucle de reintento); se reinicia"
    kill -TERM "$(cat "$PID_FILE")" 2>/dev/null
    sleep 3
    arrancar_tunel
  fi

  for repo in "${REPOS[@]}"; do
    revisar_repo "$repo"
  done

  sleep "$INTERVALO"
done
