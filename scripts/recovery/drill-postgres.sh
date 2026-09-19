#!/usr/bin/env bash
# =============================================================================
# MCH-016 · ensayo LOCAL de restauración de PostgreSQL.
#
# QUÉ HACE Y QUÉ NO
# ------------------
# Este script demuestra el mecanismo (pg_dump / pg_restore contra este mismo
# motor) y mide un RTO real de un dato conocido. NO es la prueba que pide el
# hallazgo completo: no restaura en infraestructura nueva, no cubre Mongo ni
# los objetos de MinIO, y corre contra el volumen de desarrollo de esta
# máquina, no contra un backup real de producción. Ver
# docs/operations/runbooks/restore-from-backup.md para lo que sigue sin
# demostrarse.
#
# Nunca toca la base de origen más allá de leerla (`pg_dump` es de sólo
# lectura). Todo lo que escribe vive en una base "de trabajo" aparte
# (RESTORE_DRILL_DB, por defecto `mantra_restore_drill`) dentro del MISMO
# contenedor, y el script la borra al terminar — incluso si algo falla a
# mitad de camino (trap).
#
# USO
# ----
#   scripts/recovery/drill-postgres.sh
#
# Variables de entorno (todas opcionales, con el valor de docker-compose local):
#   POSTGRES_CONTAINER   contenedor de Postgres          (mantra-redesa-postgres-1)
#   POSTGRES_USER        rol con permiso de crear DB      (mantra)
#   POSTGRES_DB          base de origen a respaldar        (mantra_redesa_health)
#   RESTORE_DRILL_DB      base de trabajo del ensayo        (mantra_restore_drill)
#   DRILL_TABLES          "schema.tabla schema.tabla …" para verificar conteos
#                         (iam.users terminology.catalog_concepts directory.tenants)
# =============================================================================
set -euo pipefail

CONTAINER="${POSTGRES_CONTAINER:-mantra-redesa-postgres-1}"
PGUSER="${POSTGRES_USER:-mantra}"
SOURCE_DB="${POSTGRES_DB:-mantra_redesa_health}"
DRILL_DB="${RESTORE_DRILL_DB:-mantra_restore_drill}"
# shellcheck disable=SC2206 # división intencional por espacios: lista de "schema.tabla".
TABLAS=(${DRILL_TABLES:-iam.users terminology.catalog_concepts directory.tenants})

DUMP_FILE="$(mktemp -t mch016-drill-XXXXXX.dump)"
RESULTADO_JSON="$(mktemp -t mch016-drill-result-XXXXXX.json)"

log() { printf '[drill] %s\n' "$1" >&2; }

limpiar() {
  # Se ejecuta pase lo que pase (éxito, fallo o Ctrl-C): la base de trabajo no
  # debe sobrevivir al ensayo, y el dump temporal tampoco.
  log "Limpiando: soltando ${DRILL_DB} (si existe) y borrando el dump temporal"
  docker exec "$CONTAINER" psql -U "$PGUSER" -d postgres -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS ${DRILL_DB} WITH (FORCE)" >/dev/null 2>&1 || true
  rm -f "$DUMP_FILE"
}
trap limpiar EXIT

log "Contenedor: $CONTAINER · origen: $SOURCE_DB · trabajo: $DRILL_DB"

if ! docker exec "$CONTAINER" true 2>/dev/null; then
  echo "[drill] ERROR: no se pudo ejecutar en el contenedor '$CONTAINER'. ¿Está arriba?" >&2
  exit 1
fi

# --- 1. Conteos de origen (evidencia de qué había que recuperar) -----------
declare -A CONTEO_ORIGEN
for tabla in "${TABLAS[@]}"; do
  n=$(docker exec "$CONTAINER" psql -U "$PGUSER" -d "$SOURCE_DB" -tAc "select count(*) from ${tabla}")
  CONTEO_ORIGEN["$tabla"]="$n"
  log "origen ${tabla}: ${n} filas"
done

# --- 2. Dump del origen (sólo lectura; no toca nada) ------------------------
INICIO_DUMP=$(date +%s)
docker exec "$CONTAINER" pg_dump -U "$PGUSER" -Fc "$SOURCE_DB" > "$DUMP_FILE"
FIN_DUMP=$(date +%s)
TAMANO_DUMP=$(stat -c%s "$DUMP_FILE" 2>/dev/null || stat -f%z "$DUMP_FILE")
log "pg_dump: $((FIN_DUMP - INICIO_DUMP))s, ${TAMANO_DUMP} bytes"

# --- 3. Medición del RTO: crear la base de trabajo y restaurar en ella ------
INICIO_RESTORE=$(date +%s)
docker exec "$CONTAINER" psql -U "$PGUSER" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS ${DRILL_DB} WITH (FORCE)"
docker exec "$CONTAINER" psql -U "$PGUSER" -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE ${DRILL_DB} TEMPLATE template0"
# `pg_restore` puede reportar advertencias por objetos que ya dependen del rol
# `mantra` (ownership) — no ON_ERROR_STOP acá: una advertencia no es un fallo
# de restauración; el veredicto real son los conteos del paso 4.
docker exec -i "$CONTAINER" pg_restore -U "$PGUSER" -d "$DRILL_DB" --no-owner --no-privileges < "$DUMP_FILE" \
  || log "pg_restore devolvió advertencias (ver arriba); se sigue con la verificación de conteos"
FIN_RESTORE=$(date +%s)
RTO_SEGUNDOS=$((FIN_RESTORE - INICIO_RESTORE))
log "pg_restore: ${RTO_SEGUNDOS}s (RTO medido de este ensayo)"

# --- 4. Verificación: los conteos de la base restaurada igualan al origen ---
FALLOS=0
for tabla in "${TABLAS[@]}"; do
  n=$(docker exec "$CONTAINER" psql -U "$PGUSER" -d "$DRILL_DB" -tAc "select count(*) from ${tabla}" 2>/dev/null || echo "ERROR")
  esperado="${CONTEO_ORIGEN[$tabla]}"
  if [ "$n" = "$esperado" ]; then
    log "OK  ${tabla}: ${n} filas (igual al origen)"
  else
    log "MAL ${tabla}: esperaba ${esperado}, la restauración tiene ${n}"
    FALLOS=$((FALLOS + 1))
  fi
done

# --- 5. Evidencia, con el contrato de MCH-023: lo no medido no se afirma ---
cat > "$RESULTADO_JSON" <<EOF
{
  "fecha": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "alcance": "PostgreSQL solamente; NO cubre MongoDB ni objetos de MinIO",
  "entorno": "desarrollo local (volumen de docker compose), no un backup de producción",
  "contenedor": "${CONTAINER}",
  "baseOrigen": "${SOURCE_DB}",
  "baseDeTrabajo": "${DRILL_DB}",
  "dumpSegundos": $((FIN_DUMP - INICIO_DUMP)),
  "dumpBytes": ${TAMANO_DUMP},
  "rtoSegundos": ${RTO_SEGUNDOS},
  "tablasVerificadas": ${#TABLAS[@]},
  "tablasConDivergencia": ${FALLOS},
  "integridadCompleta": $([ "$FALLOS" -eq 0 ] && echo true || echo false),
  "rpoMedido": null,
  "notaRpo": "Este ensayo no mide RPO: no simula pérdida de datos entre un punto de respaldo y un incidente. Queda NOT_MEASURED, no aprobado por omisión — ver MCH-023.",
  "objetosYAdjuntos": "NOT_MEASURED — este ensayo no incluye MinIO",
  "consistenciaEntreAlmacenes": "NOT_MEASURED — este ensayo no incluye MongoDB"
}
EOF

log "Evidencia: ${RESULTADO_JSON}"
cat "$RESULTADO_JSON"

if [ "$FALLOS" -gt 0 ]; then
  echo "[drill] ${FALLOS} tabla(s) no coincidieron tras la restauración" >&2
  exit 1
fi

exit 0
