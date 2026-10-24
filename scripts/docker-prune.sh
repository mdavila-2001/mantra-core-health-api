#!/usr/bin/env bash
# =========================================================================
# Mantra Core Technologies · ALOVIDA Health Ecosystem
# Limpieza de caché de build de Docker.
#
# Por qué existe: en una Dell de desarrollo la caché de build llegó a pesar
# 21.83 GB —capas de builds de hace semanas que ningún image usa— porque acá
# se reconstruye la MISMA imagen (`mantra-redesa-api:local`) una y otra vez
# para los 23 procesos (api + 22 workers), y Docker nunca la purga solo.
#
# Qué hace, y por qué es seguro correrlo en cualquier máquina compartida
# entre proyectos (esta Dell también corre `gym-sheet-backend`):
#   1. Purga caché de build con más de 7 días sin usarse. Es solo caché de
#      capas intermedias -no imágenes ni contenedores-, así que lo peor que
#      pasa es que el próximo build de ALGO sea más lento por no encontrar
#      esa capa. El filtro de 7 días evita tirar la caché fresca de builds
#      recientes (de este u otro proyecto) y así no se pierde el punto de
#      tener caché.
#   2. Purga imágenes «dangling» (sin tag, huérfanas de un build viejo).
#      Nunca borra una imagen con tag ni una en uso por un contenedor -de
#      este proyecto o de cualquier otro-, así que no le pisa el trabajo a
#      nadie más en la máquina.
#   3. Reporta el espacio recuperado.
#
# Uso:
#   yarn docker:prune
#
# Ya queda enganchado en `docker:up` y `docker:api:refresh`, que son los
# comandos con los que se levanta/reconstruye el stack. Además, la PRIMERA
# vez que corre en una máquina se instala solo como tarea programada del SO
# (Task Scheduler en Windows, cron en Linux/macOS) — así el problema no
# vuelve ni cuando alguien levanta el stack con `docker compose up`/`build`
# a secas, sin pasar por `yarn`. Es autoinstalación de una sola vez por
# máquina: en las corridas siguientes detecta que ya existe y no hace nada
# (ver `ensure_recurring_schedule` más abajo). Instaladores reutilizables en
# scripts/install-docker-prune-schedule.{ps1,sh} por si hace falta correrlos
# a mano.
# =========================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEDULE_MARKER="ALOVIDA-mantra-redesa-docker-prune"

info() { printf '\n\033[1m%s\033[0m\n' "$1"; }
ok() { printf '  \033[32mOK\033[0m   %s\n' "$1"; }
warn() { printf '  \033[33mAviso\033[0m %s\n' "$1"; }

ensure_recurring_schedule() {
  case "$(uname -s 2>/dev/null || echo unknown)" in
    MINGW*|MSYS*|CYGWIN*)
      command -v schtasks >/dev/null 2>&1 || return 0
      # MSYS_NO_PATHCONV: sin esto, Git Bash reescribe "/query" y "/tn" como
      # si fueran rutas Unix (p. ej. "C:/Program Files/Git/query") antes de
      # pasárselos a schtasks.exe, que es un binario nativo de Windows y
      # espera flags con "/". Sin la variable, la detección SIEMPRE falla y
      # reinstala la tarea en cada corrida en vez de no hacer nada.
      if ! MSYS_NO_PATHCONV=1 schtasks /query /tn "${SCHEDULE_MARKER}" >/dev/null 2>&1; then
        info "Primera vez en esta máquina: instalando tarea programada de Windows"
        if command -v powershell.exe >/dev/null 2>&1 && \
           powershell.exe -NoProfile -ExecutionPolicy Bypass \
             -File "${REPO_ROOT}/scripts/install-docker-prune-schedule.ps1" >/dev/null 2>&1; then
          ok "Tarea programada instalada (corre sola todos los días, aunque nadie use 'yarn docker:up')"
        else
          warn "No se pudo instalar sola. Corré a mano: powershell -File scripts/install-docker-prune-schedule.ps1"
        fi
      fi
      ;;
    Linux|Darwin)
      command -v crontab >/dev/null 2>&1 || return 0
      if ! crontab -l 2>/dev/null | grep -q "${SCHEDULE_MARKER}"; then
        info "Primera vez en esta máquina: instalando cron"
        if bash "${REPO_ROOT}/scripts/install-docker-prune-schedule.sh" >/dev/null 2>&1; then
          ok "Cron instalado (corre solo todos los días, aunque nadie use 'yarn docker:up')"
        else
          warn "No se pudo instalar solo. Corré a mano: bash scripts/install-docker-prune-schedule.sh"
        fi
      fi
      ;;
    *)
      : # SO no reconocido: se sigue con la purga manual, sin autoinstalar nada.
      ;;
  esac
}

command -v docker >/dev/null || { echo "docker no está instalado o no está en el PATH"; exit 1; }
if ! docker info >/dev/null 2>&1; then
  echo "El daemon de Docker no responde (¿está Docker Desktop / dockerd arriba?)"
  exit 1
fi

ensure_recurring_schedule

BEFORE="$(docker system df --format '{{.Type}}: {{.Size}} ({{.Reclaimable}} reclamable)' 2>/dev/null || true)"

info "1. Purgando caché de build con más de 7 días sin usarse"
docker builder prune --all --force --filter "until=168h" 2>&1 | tail -5
ok "Caché de build purgada"

info "2. Purgando imágenes sin tag (huérfanas de builds viejos)"
docker image prune --force 2>&1 | tail -5
ok "Imágenes huérfanas purgadas"

info "Antes"
printf '%s\n' "${BEFORE}"

info "Después"
docker system df --format '{{.Type}}: {{.Size}} ({{.Reclaimable}} reclamable)' 2>/dev/null || true
