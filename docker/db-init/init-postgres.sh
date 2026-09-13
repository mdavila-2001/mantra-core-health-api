#!/usr/bin/env bash
# =========================================================================
# Mantra Core Technologies · REDESA Health Ecosystem
# postgres-init: aplica el DDL relacional (SQL/) y los stores PG de NoSQL/
# (58 TimescaleDB, 59 pgvector) si aún no existen. Idempotente.
#
# Orden: apply_all.sql (sin 90_fk_deferred) → apply_deferred.sql (FK
# cross-schema) → patches → time_series → vector_rag.
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

# ORDEN: los stores PG de NoSQL/ van ANTES que patches/, y no es cosmético.
# `2026-07-25_v407_nullable_embedding_model_versions.sql` hace un ALTER sobre
# `vector_rag.embedding_model_versions`, tabla que crea el DDL 59. Con patches/
# delante, sobre una base recién creada eso es
# «ERROR: schema "vector_rag" does not exist» y, con ON_ERROR_STOP=1,
# `postgres-init` sale con 3 y se lleva por delante a `api-migrate` y a la API.
# No se notaba en una base ya poblada —donde vector_rag existía de un arranque
# anterior—, solo en la PRIMERA puesta en marcha, que es justo la del servidor.

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

# Migraciones posteriores a la generación de SQL/ (tablas y columnas que los
# módulos añadieron después). Todas son ADITIVAS e idempotentes por contrato
# (IF NOT EXISTS), así que se aplican siempre y en orden de nombre — que al ser
# `YYYY-MM-DD_*.sql` es también orden cronológico.
#
# **El directorio se llama `patches/`.** Esto buscaba en `99_migrations/`, que no
# existe en ninguno de los dos montajes —ni en `SQL/` del repositorio del modelo
# ni en la copia versionada de `database/SQL/`—, así que el glob no encontraba
# nada. Y como `nullglob` convierte un glob sin coincidencias en la lista vacía,
# el bucle daba CERO vueltas sin una línea de aviso: las 24 migraciones llevaban
# semanas sin aplicarse y el arranque decía «completado» igual.
#
# El síntoma no aparece en el arranque sino mucho después y en otro sitio: con
# `ORM_SCHEMA_SYNC=safe` la entidad crea por su cuenta las columnas que sabe
# declarar, así que la falta sólo se nota en lo que NINGUNA entidad puede
# reconstruir —datos de arranque, backfills, restricciones— y revienta al
# escribir. `insurance_carriers.sigla` fue justo eso.
#
# Por eso el paso ya no puede quedarse callado: si no hay ni un archivo, aborta.
MIGRACIONES=/init/SQL/patches
# `99_migrations/` se sigue aceptando por si algún despliegue lo tiene con el
# nombre viejo; el que exista de los dos manda, y `patches/` tiene prioridad.
[ -d "$MIGRACIONES" ] || MIGRACIONES=/init/SQL/99_migrations

shopt -s nullglob
migraciones=("$MIGRACIONES"/*.sql)
shopt -u nullglob

if [ ${#migraciones[@]} -eq 0 ]; then
    echo "!!! No hay una sola migración en $MIGRACIONES."
    echo "!!! Eso NO es un caso normal: el repositorio trae dos docenas y sin ellas"
    echo "!!! la base queda a medias de una forma que no se nota hasta la primera"
    echo "!!! escritura. Revisá que el montaje del DDL apunte a un 'SQL/' con"
    echo "!!! 'patches/' dentro (compose: ../mantra-core-health-model/SQL o ./database/SQL)."
    exit 4
fi

# NO TODO LO QUE HAY EN patches/ ES UNA MIGRACIÓN DE ESQUEMA.
# Hay tres clases de archivo mezcladas, y dos de ellas NO pueden correr acá:
#
#   a) Migraciones de esquema (la inmensa mayoría). Aditivas e idempotentes;
#      se aplican siempre y son las que justifican este paso.
#
#   b) `*_dev_seed.sql` — datos de ejemplo. El propio archivo dice «se aplica a
#      mano cuando se lo necesita» y «prohibido usarlo para decisión clínica o
#      en producción». Se aplican SOLO si se piden: APPLY_DEV_SEEDS=1.
#
#   c) Patches de DATOS sobre una base viva: backfills que reparan filas que
#      quedaron mal ANTES del despliegue. Dependen del catálogo de terminología,
#      que siembra `api-migrate` DESPUÉS de este contenedor, y traen una guarda
#      que lo comprueba y aborta en voz alta. En una base recién creada no hay
#      nada que reparar —el propio backfill lo dice: «este patch NO hace falta
#      en un rebuild desde cero»— pero su guarda salta igual, y con
#      ON_ERROR_STOP=1 eso es salida 3 y el despliegue entero abajo. Fue
#      exactamente lo que pasó con `..._backfill_membresias_asistenciales.sql`:
#      «Falta el concepto directory:ROLE_PRACTITIONER … Desplegá la API antes».
#
# El criterio para (c) NO es «si falla, seguimos» —eso es lo que dejaba la base
# a medias sin avisar— sino el estado real de la base: si el catálogo todavía
# no está sembrado, la base es NUEVA y esos patches no tienen sujeto; se omiten
# nombrándolos. Si ya está sembrado —redespliegue sobre una base viva, que es
# donde sí reparan algo— se aplican como siempre, bajo ON_ERROR_STOP.
APPLY_DEV_SEEDS="${APPLY_DEV_SEEDS:-0}"

CATALOGO_SEMBRADO=0
if pg_true "SELECT to_regclass('terminology.catalog_concepts') IS NOT NULL"; then
    if pg_true "SELECT EXISTS (SELECT 1 FROM terminology.catalog_concepts)"; then
        CATALOGO_SEMBRADO=1
    fi
fi
[ "$CATALOGO_SEMBRADO" = 1 ] \
    && echo ">>> Catálogo de terminología: sembrado (base viva)" \
    || echo ">>> Catálogo de terminología: vacío — base nueva, sin nada que reparar"

echo ">>> $(basename "$MIGRACIONES"): ${#migraciones[@]} archivos"
for migration in "${migraciones[@]}"; do
    nombre="$(basename "$migration")"

    if [[ "$nombre" == *_dev_seed.sql && "$APPLY_DEV_SEEDS" != "1" ]]; then
        echo "=== $nombre: seed de desarrollo — se omite."
        echo "=== Para aplicarlo: APPLY_DEV_SEEDS=1, con el catálogo ya sembrado"
        echo "=== (necesita los conceptos de idioma, que siembra api-migrate)."
        continue
    fi

    if [[ "$nombre" == *backfill* && "$CATALOGO_SEMBRADO" != "1" ]]; then
        echo "=== $nombre: backfill sobre base viva — se omite en una base nueva."
        echo "=== No hay filas anteriores que reparar, y su guarda de orden exige"
        echo "=== conceptos que siembra api-migrate después de este paso."
        continue
    fi

    echo ">>> $(basename "$MIGRACIONES")/$nombre"
    "${PSQL[@]}" -f "$migration"
done

echo "=== postgres-init completado"
