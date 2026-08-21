#!/usr/bin/env bash
# =========================================================================
# Mantra Core Technologies · REDESA Health Ecosystem
# Instala un cron diario que corre scripts/docker-prune.sh, sin depender de
# que alguien recuerde usar `yarn docker:up` o `yarn docker:api:refresh`.
# Es el respaldo para cuando alguien levanta el stack con
# `docker compose up`/`build` a secas.
#
# Idempotente: si la línea de cron ya existe (se identifica por el marcador
# ALOVIDA-mantra-redesa-docker-prune), la reemplaza en vez de duplicarla.
#
# Uso (una sola vez por máquina Linux/macOS):
#   bash scripts/install-docker-prune-schedule.sh
#
# Para Windows ver scripts/install-docker-prune-schedule.ps1 (Task Scheduler).
# =========================================================================
set -euo pipefail

MARKER="ALOVIDA-mantra-redesa-docker-prune"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="${REPO_ROOT}/scripts/docker-prune.sh"

[ -f "${SCRIPT_PATH}" ] || { echo "No se encontró ${SCRIPT_PATH}"; exit 1; }

CRON_LINE="0 9 * * * cd '${REPO_ROOT}' && bash scripts/docker-prune.sh >> /tmp/docker-prune.log 2>&1 # ${MARKER}"

EXISTING="$(crontab -l 2>/dev/null | grep -v "${MARKER}" || true)"
printf '%s\n%s\n' "${EXISTING}" "${CRON_LINE}" | sed '/^$/d' | crontab -

echo "Listo. Corre todos los días a las 9am, incluso si nadie usa 'yarn docker:up'."
echo "Log: /tmp/docker-prune.log"
echo "Para desinstalarlo: crontab -l | grep -v '${MARKER}' | crontab -"
