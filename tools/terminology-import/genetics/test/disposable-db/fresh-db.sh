#!/bin/sh
# Base DESECHABLE para medir el cargador de genética: recrea $DB_NAME con el esquema
# `terminology` de ESTE repo (database/SQL) y siembra los conceptos internos que en
# producción pone la API al arrancar. NO aplica el parche de evidencia de relaciones
# (el repo del modelo no está en esta máquina): ver docs/seed-research/genetics.md.
#
#   DISPOSABLE_DB=1 DB_HOST=127.0.0.1 DB_PORT=55442 DB_USER=mantra DB_NAME=c12_test \
#   sh tools/terminology-import/genetics/test/disposable-db/fresh-db.sh
# Nunca contra una base real.
set -e
refuse() { echo "fresh-db.sh se niega: $1" >&2; exit 4; }
[ "${DISPOSABLE_DB:-}" = "1" ] || refuse "falta DISPOSABLE_DB=1 (confirmación de que la base es desechable)"
: "${DB_HOST:?falta DB_HOST}" "${DB_PORT:?falta DB_PORT}" "${DB_USER:?falta DB_USER}" "${DB_NAME:?falta DB_NAME}"
case "$DB_NAME" in postgres|template0|template1) refuse "DB_NAME=$DB_NAME es una base del sistema";; esac
case "$DB_NAME" in *_test) ;; *) refuse "DB_NAME=$DB_NAME no termina en _test";; esac
case "$DB_HOST" in /*|localhost|127.0.0.1) ;; *) refuse "DB_HOST=$DB_HOST no es local";; esac
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd)
Q="psql -q -h $DB_HOST -p $DB_PORT -U $DB_USER"
$Q -d postgres -c "drop database if exists $DB_NAME" -c "create database $DB_NAME"
cd "$ROOT/database/SQL"
# 90_fk_deferred.sql apunta también a esquemas que esta base no tiene (common, directory): esos errores se ignoran.
for f in 00_shared/00_types.sql 03_terminology/01_schema.sql 03_terminology/02_tables.sql 03_terminology/03_fk_intra.sql 03_terminology/04_indexes.sql 03_terminology/90_fk_deferred.sql; do
  $Q -d "$DB_NAME" -f "$f" >/dev/null 2>&1 || true
done
echo ">>> tablas de terminology:"
$Q -d "$DB_NAME" -At -c "select count(*) from information_schema.tables where table_schema='terminology'"
cd "$ROOT" && node tools/terminology-import/genetics/test/disposable-db/seed-scaffold.mjs "$@"
