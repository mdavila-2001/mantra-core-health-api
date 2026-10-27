#!/bin/sh
# Base DESECHABLE para medir los cargadores de síntomas: recrea $DB_NAME con el
# esquema terminology de ESTE repo (database/SQL, copia versionada del modelo) y,
# encima, el patch del repo del modelo que agrega la evidencia de las relaciones
# (SQL/patches/2026-10-25_v4250_terminology_relationship_evidence.sql, commit
# e8bd453). El patch se aplica TAL CUAL, sin tocarlo: aplicarlo dos veces tiene
# que dar lo mismo (es idempotente) y eso se comprueba acá.
#
# Uso (Postgres 16 local, p. ej. initdb en /var/tmp/pg-C2):
#   DB_HOST=/var/tmp/pgsock-C2 DB_PORT=55402 DB_USER=mantra DB_NAME=symptoms_test \
#   MODEL_REPO=/home/user/mantra-core-health-model \
#   sh tools/terminology-import/symptoms/test/disposable-db/fresh-db.sh
# Nunca contra una base real.
set -e
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd)
MODEL_REPO=${MODEL_REPO:-/home/user/mantra-core-health-model}
Q="psql -q -h $DB_HOST -p $DB_PORT -U $DB_USER"
PATCH="$MODEL_REPO/SQL/patches/2026-10-25_v4250_terminology_relationship_evidence.sql"
[ -f "$PATCH" ] || { echo "Falta el patch del modelo: $PATCH" >&2; exit 2; }
$Q -d postgres -c "drop database if exists $DB_NAME" -c "create database $DB_NAME"
cd "$ROOT/database/SQL"
# 90_fk_deferred.sql apunta también a esquemas que esta base no tiene (common, directory): esos errores se ignoran.
for f in 00_shared/00_types.sql 01_iam/01_schema.sql 01_iam/02_tables.sql 03_terminology/01_schema.sql 03_terminology/02_tables.sql 03_terminology/03_fk_intra.sql 03_terminology/04_indexes.sql 03_terminology/90_fk_deferred.sql; do
  $Q -d "$DB_NAME" -f "$f" >/dev/null 2>&1 || true
done
echo ">>> tablas de evidencia ANTES del patch:"
$Q -d "$DB_NAME" -At -c "select count(*) from information_schema.tables where table_schema='terminology' and table_name='concept_relationship_evidence'"
echo ">>> patch del modelo, 1.ª aplicación"
$Q -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$PATCH"
echo ">>> patch del modelo, 2.ª aplicación (idempotencia)"
$Q -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$PATCH"
echo ">>> tablas de evidencia DESPUÉS del patch:"
$Q -d "$DB_NAME" -At -c "select count(*) from information_schema.tables where table_schema='terminology' and table_name='concept_relationship_evidence'"
cd "$ROOT" && MODEL_REPO="$MODEL_REPO" node tools/terminology-import/symptoms/test/disposable-db/seed-scaffold.mjs "$@"
