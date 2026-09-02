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

# 58/59 son extensiones PG en esta misma instancia — se aplican siempre.
echo ">>> NoSQL 58: time_series (TimescaleDB)"
"${PSQL[@]}" -f /init/NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql

# El 59 tiene una línea que NO es idempotente, y decir que sí lo era costó el
# arranque entero: el DDL declara la columna como `vector(1536)`, pero si la
# tabla ya existe —la crea el ORM, que la declara como `vector` a secas, y
# `CREATE TABLE IF NOT EXISTS` no corrige una tabla existente— el índice HNSW
# muere con `ERROR: column does not have dimensions`. `IF NOT EXISTS` no salva
# nada ahí: el índice no existe y **nunca va a poder existir**, así que el error
# se repite en cada arranque, y con `ON_ERROR_STOP=1` `postgres-init` sale con 3
# y se lleva puesta a la API, que espera su `service_completed_successfully`.
#
# La dimensión no se fija acá: es una decisión del modelo, es irreversible sin
# recrear la tabla, y el código ya la tomó — `src/orm/catalog/physical.catalog.ts`
# omite este mismo índice con una condición previa explícita. Esto hace lo mismo
# con la misma condición (`atttypmod > 0`), y lo dice en voz alta en vez de
# tragarse un error genérico: lo demás del archivo sigue bajo ON_ERROR_STOP.
echo ">>> NoSQL 59: vector_rag (pgvector)"
DDL_59=/init/NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql
# Si la tabla todavía no existe, `to_regclass` da NULL y aquí se responde que sí:
# el DDL la creará con dimensión y el índice entra sin problema.
if pg_true "SELECT COALESCE(
              (SELECT atttypmod > 0
                 FROM pg_attribute
                WHERE attrelid = to_regclass('vector_rag.vector_embeddings')
                  AND attname  = 'embedding'), true)"; then
    "${PSQL[@]}" -f "$DDL_59"
else
    echo "!!! vector_rag.vector_embeddings.embedding existe SIN dimensión (la creó el ORM,"
    echo "!!! que la declara como 'vector' a secas). Se omite el índice HNSW: la búsqueda"
    echo "!!! por similitud funciona pero recorre el corpus entero — aceptable en"
    echo "!!! desarrollo, NO en producción. Para arreglarlo hay que recrear la tabla con"
    echo "!!! 'vector(N)', que es una decisión del modelo."
    grep -v 'USING hnsw' "$DDL_59" | "${PSQL[@]}" -f -
fi

echo "=== postgres-init completado"
