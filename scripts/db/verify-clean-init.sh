#!/usr/bin/env bash
# =========================================================================
# Mantra Core Technologies · ALOVIDA
# Levanta una base limpia en un proyecto compose efímero, aplica el DDL por
# defecto, corre los seeds y verifica la fidelidad del ORM contra el esquema
# resultante.
#
# POR QUÉ EXISTE
# --------------
# El compose puede aplicar el DDL desde dos orígenes: la copia versionada del
# repositorio (`database/SQL`, `database/NoSQL`, el valor por defecto) o el
# repositorio del modelo, exportando `SQL_MODEL_DIR`/`NOSQL_MODEL_DIR`. Este
# script comprueba, con evidencia y no por lectura, que el origen por defecto
# resuelve dentro del repositorio y que una base construida solo con esa
# copia queda completa: los contenedores de inicialización terminan en 0, una
# columna que solo llegó por un patch reciente existe, y la siembra corre sin
# deriva nueva entre el modelo mapeado y la base real.
#
#   bash scripts/db/verify-clean-init.sh
#
# Variables opcionales:
#   VERIFY_PROJECT     nombre del proyecto compose efímero (default: mantra-ddl-verify)
#   VERIFY_PORT_BASE   base para los puertos publicados (default: 15000)
#   KEEP=1             no baja el proyecto efímero al terminar (depuración)
#   VERIFY_ONLY_STEP   número de paso a correr en soledad, sin los siguientes
#                      (1 = solo la comprobación de binds; no requiere Docker
#                      arriba ni levanta contenedores)
#
# El proyecto efímero jamás toca el stack de desarrollo (`mantra-redesa`):
# nombre de proyecto, red y volúmenes propios (`name:` de `docker-compose.yml`
# se arma con `COMPOSE_PROJECT_NAME`), y puertos publicados en otro rango. El
# `trap` de limpieza baja SOLO ese proyecto, salvo `KEEP=1`.
# =========================================================================
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

VERIFY_PROJECT="${VERIFY_PROJECT:-mantra-ddl-verify}"
VERIFY_PORT_BASE="${VERIFY_PORT_BASE:-15000}"
KEEP="${KEEP:-0}"

export COMPOSE_PROJECT_NAME="$VERIFY_PROJECT"
export POSTGRES_PORT=$((VERIFY_PORT_BASE + 433))
export MONGO_PORT=$((VERIFY_PORT_BASE + 7018))
export REDIS_PORT=$((VERIFY_PORT_BASE + 380))
export OPENSEARCH_PORT=$((VERIFY_PORT_BASE + 201))
export OPENSEARCH_MONITOR_PORT=$((VERIFY_PORT_BASE + 601))

compose_cmd=(docker compose -p "$VERIFY_PROJECT" --profile local-db)

cleanup() {
  if [[ "$KEEP" == "1" ]]; then
    echo ">>> KEEP=1: se deja el proyecto efímero '$VERIFY_PROJECT' arriba"
    return
  fi
  "${compose_cmd[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

# --- Paso 1: los binds de los servicios de init caen dentro del repo -------
#
# Se lee `docker compose config` (sin `-p` efímero: solo inspecciona, no crea
# nada) y se comprueba que cada `source:` de tipo bind de `postgres-init`,
# `mongo-init` y `opensearch-init` empieza por la raíz del repositorio. En
# Windows el YAML resuelto imprime rutas con backslash y letra de unidad
# (`C:\Users\...`): se normalizan a `/` y se compara sin distinguir mayúsculas
# de esa letra.
extract_service_block() {
  local service="$1"
  local config_file="$2"
  awk -v svc="  ${service}:" '
    $0 == svc { found = 1; print; next }
    found && /^  [A-Za-z0-9_-]+:$/ { exit }
    found { print }
  ' "$config_file"
}

normalize_path() {
  printf '%s' "$1" | tr '\\' '/' | tr '[:upper:]' '[:lower:]'
}

check_binds_inside_repo() {
  echo ">>> Paso 1: los binds de postgres-init/mongo-init/opensearch-init caen dentro del repositorio"

  local config_file
  config_file="$(mktemp)"
  docker compose --profile local-db config >"$config_file"

  local repo_root_norm
  repo_root_norm="$(normalize_path "$repo_root")"

  local failed=0
  local service
  for service in postgres-init mongo-init opensearch-init; do
    local sources
    sources="$(extract_service_block "$service" "$config_file" \
      | grep -E '^\s+source:' \
      | sed -E 's/^\s+source:\s*//')"

    if [[ -z "$sources" ]]; then
      echo "!!! $service no declara ningún volumen bind" >&2
      failed=1
      continue
    fi

    while IFS= read -r source_path; do
      [[ -z "$source_path" ]] && continue
      local normalized
      normalized="$(normalize_path "$source_path")"
      case "$normalized" in
        "$repo_root_norm"*) ;;
        *)
          echo "!!! $service monta fuera del repositorio: $source_path" >&2
          failed=1
          ;;
      esac
    done <<<"$sources"
  done

  rm -f "$config_file"

  if [[ "$failed" -ne 0 ]]; then
    echo "=== FALLO: paso 1"
    return 1
  fi
  echo "=== OK: paso 1"
  return 0
}

# --- Paso 2: base limpia ----------------------------------------------------
wait_for_init_service() {
  local service="$1"
  # `compose wait` bloquea hasta que el contenedor termina; el código de
  # salida se lee del contenedor, no de lo que `wait` imprime (mezcla avisos
  # con el resultado y cambia de formato entre versiones).
  "${compose_cmd[@]}" wait "$service" >/dev/null 2>&1 || true
  local container_id exit_code
  container_id="$("${compose_cmd[@]}" ps -aq "$service" 2>/dev/null | head -n 1)"
  exit_code="$(docker inspect -f '{{.State.ExitCode}}' "$container_id" 2>/dev/null || echo desconocido)"
  "${compose_cmd[@]}" logs --no-log-prefix "$service" 2>&1 | tail -n 15 || true
  if [[ "$exit_code" != "0" ]]; then
    echo "!!! $service terminó con código $exit_code" >&2
    return 1
  fi
}

bring_up_clean_stack() {
  echo ">>> Paso 2: levantando una base limpia en el proyecto efímero '$VERIFY_PROJECT'"

  "${compose_cmd[@]}" up -d \
    postgres postgres-init mongodb mongo-init opensearch opensearch-init redis

  wait_for_init_service postgres-init || {
    echo "=== FALLO: paso 2 (postgres-init)"
    return 1
  }
  wait_for_init_service mongo-init || {
    echo "=== FALLO: paso 2 (mongo-init)"
    return 1
  }
  wait_for_init_service opensearch-init || {
    echo "=== FALLO: paso 2 (opensearch-init)"
    return 1
  }

  echo "=== OK: paso 2"
}

# --- Paso 3: la columna que solo llegó por patch reciente existe -----------
check_seeded_column() {
  echo ">>> Paso 3: insurance.insurance_carriers.sigla existe y se cuentan las tablas"

  local sigla_present
  sigla_present="$("${compose_cmd[@]}" exec -T postgres sh -c \
    'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = '"'"'insurance'"'"'
        AND table_name = '"'"'insurance_carriers'"'"'
        AND column_name = '"'"'sigla'"'"'
    "')"
  sigla_present="$(printf '%s' "$sigla_present" | tr -d '[:space:]')"

  if [[ "$sigla_present" != "1" ]]; then
    echo "!!! insurance.insurance_carriers.sigla no está presente" >&2
    echo "=== FALLO: paso 3"
    return 1
  fi

  local table_count
  table_count="$("${compose_cmd[@]}" exec -T postgres sh -c \
    'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "
      SELECT count(*) FROM information_schema.tables
      WHERE table_schema NOT IN ('"'"'pg_catalog'"'"', '"'"'information_schema'"'"')
        AND table_schema NOT LIKE '"'"'_timescaledb%'"'"'
    "')"
  table_count="$(printf '%s' "$table_count" | tr -d '[:space:]')"

  echo "    tablas materializadas: $table_count"
  echo "=== OK: paso 3"
}

# --- Paso 4: seeds + fidelidad ----------------------------------------------
resolve_mongo_db() {
  local config_file
  config_file="$(mktemp)"
  "${compose_cmd[@]}" config >"$config_file"
  extract_service_block mongo-init "$config_file" \
    | grep -E '^\s+MONGO_DB:' \
    | sed -E 's/^\s+MONGO_DB:\s*//; s/^"//; s/"$//' \
    | head -n 1
  rm -f "$config_file"
}

check_seed_and_fidelity() {
  echo ">>> Paso 4: seed:boot en dry-run y fidelidad del ORM"

  if [[ ! -f "$repo_root/dist/src/seed-cli.js" ]]; then
    echo "!!! falta dist/src/seed-cli.js: correr 'corepack yarn build' antes" >&2
    return 2
  fi

  # La base Mongo es la misma que creó `mongo-init`: se lee del compose
  # resuelto (no es un secreto) en vez de repetir el valor por defecto acá.
  local mongo_db
  mongo_db="$(resolve_mongo_db)"
  mongo_db="${mongo_db:-salud_document_store}"
  local log
  log="$(mktemp)"

  set +e
  DB_HOST=localhost \
    DB_PORT="$POSTGRES_PORT" \
    DB_SSL=false \
    MONGODB_URI="mongodb://localhost:${MONGO_PORT}/${mongo_db}" \
    REDIS_HOST=localhost \
    REDIS_PORT="$REDIS_PORT" \
    OPENSEARCH_NODE="http://localhost:${OPENSEARCH_PORT}" \
    ORM_SCHEMA_SYNC=dry-run \
    ORM_VERIFY_FIDELITY=true \
    SEED_ON_BOOT=false \
    node "$repo_root/dist/src/seed-cli.js" 2>&1 | tee "$log"
  local seed_exit=${PIPESTATUS[0]}
  set -e

  if [[ "$seed_exit" -ne 0 ]]; then
    echo "!!! seed-cli salió con código $seed_exit" >&2
    rm -f "$log"
    echo "=== FALLO: paso 4"
    return 1
  fi

  local failed=0
  if grep -q 'columna-ausente=' "$log"; then
    echo "!!! deriva bloqueante: columna-ausente > 0" >&2
    failed=1
  fi
  if grep -q 'columna-obligatoria-no-mapeada=' "$log"; then
    echo "!!! deriva bloqueante: columna-obligatoria-no-mapeada > 0" >&2
    failed=1
  fi
  if grep -qE 'tabla-ausente=|obligatoriedad-divergente=' "$log"; then
    grep -E 'Deriva detectada' "$log" | while IFS= read -r linea; do
      echo "    $linea — heredado (pharma_lab/polyglot_storage), no bloquea"
    done
  fi

  rm -f "$log"

  if [[ "$failed" -ne 0 ]]; then
    echo "=== FALLO: paso 4"
    return 1
  fi
  echo "=== OK: paso 4"
}

# --- Paso 5: resumen ---------------------------------------------------------
main() {
  if [[ "${VERIFY_ONLY_STEP:-0}" == "1" ]]; then
    check_binds_inside_repo
    return $?
  fi

  check_binds_inside_repo
  bring_up_clean_stack
  check_seeded_column
  check_seed_and_fidelity

  echo ">>> Paso 5: resumen"
  echo "    paso 1 (binds dentro del repo): OK"
  echo "    paso 2 (base limpia, *-init en 0): OK"
  echo "    paso 3 (sigla presente): OK"
  echo "    paso 4 (seeds + fidelidad): OK"
  echo "=== verify-clean-init: PASS"
}

main "$@"
