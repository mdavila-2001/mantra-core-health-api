#!/bin/sh
# Base DESECHABLE para medir el cargador: recrea $DB_NAME con el esquema
# terminology del repo (database/SQL, sin DDL nuevo) y los conceptos internos.
# Uso (Postgres 16 local, p. ej. initdb en /var/tmp):
#   DB_HOST=/var/tmp/pg-diseases DB_PORT=5499 DB_USER=mantra DB_NAME=diseases_test sh tools/terminology-import/diseases/test/disposable-db/fresh-db.sh
set -e
# Guard: esto hace `drop database`. Sólo contra un Postgres local y una base cuyo nombre termina en `_test`
# (nunca contra la del stack real, aunque las variables de entorno apunten ahí).
case "$DB_HOST" in 127.0.0.1|localhost|/*) ;; *) echo "fresh-db.sh: DB_HOST=$DB_HOST no es local; me niego." >&2; exit 2 ;; esac
case "$DB_NAME" in *_test) ;; *) echo "fresh-db.sh: DB_NAME=$DB_NAME no termina en _test; me niego." >&2; exit 2 ;; esac
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd)
Q="psql -q -h $DB_HOST -p $DB_PORT -U $DB_USER"
$Q -d postgres -c "drop database if exists $DB_NAME" -c "create database $DB_NAME"
cd "$ROOT/database/SQL"
# 90_fk_deferred.sql apunta también a esquemas que esta base no tiene (common, directory): esos errores se ignoran.
for f in 00_shared/00_types.sql 01_iam/01_schema.sql 01_iam/02_tables.sql 03_terminology/01_schema.sql 03_terminology/02_tables.sql 03_terminology/03_fk_intra.sql 03_terminology/04_indexes.sql 03_terminology/90_fk_deferred.sql; do
  $Q -d "$DB_NAME" -f "$f" >/dev/null 2>&1 || true
done
cd "$ROOT" && node tools/terminology-import/diseases/test/disposable-db/seed-internal.mjs
