#!/bin/sh
# Base DESECHABLE (Postgres 16 propio, nunca la del stack): recrea $DB_NAME con el esquema `terminology` de
# `database/SQL` (sin DDL nuevo) y los conceptos internos que en una base real siembra la API al arrancar.
#   DB_HOST=127.0.0.1 DB_PORT=55408 DB_USER=mantra DB_NAME=desechable_nursing sh tools/terminology-import/nursing-care/test/disposable-db/fresh-db.sh
set -e
# GUARD: este script hace `drop database`. Sólo corre contra una base DESECHABLE: nombre con prefijo `desechable_` y servidor local.
case "$DB_NAME" in desechable_[a-z0-9_]*) ;; *) echo "ABORTA: DB_NAME='$DB_NAME' no empieza con 'desechable_' (este script borra la base)"; exit 2;; esac
case "$DB_HOST" in 127.0.0.1|localhost|/*) ;; *) echo "ABORTA: DB_HOST='$DB_HOST' no es local"; exit 2;; esac
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd)
Q="psql -q -h $DB_HOST -p $DB_PORT -U $DB_USER"
$Q -d postgres -c "drop database if exists $DB_NAME" -c "create database $DB_NAME"
cd "$ROOT/database/SQL"
# 90_fk_deferred.sql apunta también a esquemas que esta base no tiene (common, directory): esos errores se ignoran.
for f in 00_shared/00_types.sql 01_iam/01_schema.sql 01_iam/02_tables.sql 03_terminology/01_schema.sql 03_terminology/02_tables.sql 03_terminology/03_fk_intra.sql 03_terminology/04_indexes.sql 03_terminology/90_fk_deferred.sql; do
  $Q -d "$DB_NAME" -f "$f" >/dev/null 2>&1 || true
done
cd "$ROOT" && node tools/terminology-import/nursing-care/test/disposable-db/seed-internal.mjs
