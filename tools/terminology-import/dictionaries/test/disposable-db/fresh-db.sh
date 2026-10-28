#!/bin/sh
# Base DESECHABLE para medir el cargador de diccionarios: recrea $DB_NAME con el
# esquema terminology del repo (database/SQL, sin DDL nuevo) y los conceptos
# internos que usa el cargador. Mismo patrón que diseases/test/disposable-db.
#   DB_HOST=<dir del socket> DB_PORT=55407 DB_USER=mantra DB_NAME=dict_test sh tools/terminology-import/dictionaries/test/disposable-db/fresh-db.sh
set -e
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd)
Q="psql -q -h $DB_HOST -p $DB_PORT -U $DB_USER"
$Q -d postgres -c "drop database if exists $DB_NAME" -c "create database $DB_NAME"
cd "$ROOT/database/SQL"
# 90_fk_deferred.sql apunta también a esquemas que esta base no tiene (common, directory): esos errores se ignoran.
for f in 00_shared/00_types.sql 01_iam/01_schema.sql 01_iam/02_tables.sql 03_terminology/01_schema.sql 03_terminology/02_tables.sql 03_terminology/03_fk_intra.sql 03_terminology/04_indexes.sql 03_terminology/90_fk_deferred.sql; do
  $Q -d "$DB_NAME" -f "$f" >/dev/null 2>&1 || true
done
cd "$ROOT" && node tools/terminology-import/dictionaries/test/disposable-db/seed-internal.mjs
