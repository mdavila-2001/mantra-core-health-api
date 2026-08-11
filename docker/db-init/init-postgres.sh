#!/usr/bin/env bash
# =========================================================================
# Mantra Core Technologies · REDESA Health Ecosystem
# postgres-init: aplica el DDL relacional (SQL/) y los stores PG de NoSQL/
# (58 TimescaleDB, 59 pgvector) si aún no existen. Idempotente.
#
# Orden: apply_all.sql (sin 90_fk_deferred) → apply_deferred.sql (FK
# cross-schema) → 99_migrations → time_series → vector_rag.
# =========================================================================
set -euo pipefail

: "${POSTGRES_DB:?POSTGRES_DB requerida}"
: "${POSTGRES_USER:?POSTGRES_USER requerida}"
export PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD requerida}"

PSQL=(psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1)

echo ">>> Esperando a que PostgreSQL acepte conexiones..."
until psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' >/dev/null 2>&1; do
    sleep 1
done

pg_true() {
    [[ "$("${PSQL[@]}" -qtAc "$1")" == "t" ]]
}

# Guard de tablas: iam.users como centinela de todo apply_all.sql
if pg_true "SELECT to_regclass('iam.users') IS NOT NULL"; then
    echo "=== apply_all: iam.users ya existe — skip"
else
    echo ">>> apply_all.sql (todo el DDL relacional, sin 90_fk_deferred)"
    "${PSQL[@]}" -f /init/SQL/apply_all.sql
fi

# Guard de FK diferidas: primera FK cross-schema del módulo 01 como centinela.
# Los 90_fk_deferred son idempotentes (DO $$ ... duplicate_object), el guard
# solo evita recorrerlos en cada arranque.
if pg_true "SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_status_concept_id')"; then
    echo "=== apply_deferred: FK cross-schema ya aplicadas — skip"
else
    echo ">>> apply_deferred.sql (90_fk_deferred, FK cross-schema)"
    "${PSQL[@]}" -f /init/SQL/apply_deferred.sql
fi

# Migraciones posteriores a la generación de SQL/ (tablas y columnas que los
# módulos añadieron después). Todas son ADITIVAS e idempotentes por contrato
# (IF NOT EXISTS), así que se aplican siempre y en orden de nombre — que al ser
# `YYYY-MM-DD_*.sql` es también orden cronológico. Sin este paso quedaban sin
# aplicar contra una base recién levantada y las tablas que declaran (p. ej.
# iam.account_activations) sólo existían si se arrancaba con ORM_SCHEMA_SYNC=safe.
shopt -s nullglob
for migration in /init/SQL/99_migrations/*.sql; do
    echo ">>> 99_migrations/$(basename "$migration")"
    "${PSQL[@]}" -f "$migration"
done
shopt -u nullglob

# 58/59 son extensiones PG en esta misma instancia y 100% idempotentes
# (CREATE ... IF NOT EXISTS, create_hypertable if_not_exists) — se aplican siempre.
echo ">>> NoSQL 58: time_series (TimescaleDB)"
"${PSQL[@]}" -f /init/NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql

echo ">>> NoSQL 59: vector_rag (pgvector)"
"${PSQL[@]}" -f /init/NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql

echo "=== postgres-init completado"
