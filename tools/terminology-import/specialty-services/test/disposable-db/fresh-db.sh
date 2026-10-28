#!/bin/sh
# Base DESECHABLE (Postgres 16 propio, nunca la del stack): esquema `terminology` de `database/SQL` + lo que la API y el
# paquete del modelo siembran (conceptos internos, VS_MEDICAL_SPECIALTY con las 63 especialidades, conceptos del arancel boliviano).
#   DB_HOST=127.0.0.1 DB_PORT=55408 DB_USER=mantra DB_NAME=spec_test sh tools/terminology-import/specialty-services/test/disposable-db/fresh-db.sh
set -e
# GUARD: este script hace `drop database`. Sólo corre contra un Postgres local y una base cuyo nombre termina en `_test`
# (nunca contra la del stack real, aunque las variables de entorno apunten ahí). Probado en test/*.test.mjs.
case "$DB_HOST" in 127.0.0.1|localhost|/*) ;; *) echo "ABORTA: DB_HOST='$DB_HOST' no es local (este script borra la base)" >&2; exit 2;; esac
case "$DB_NAME" in ?*_test) ;; *) echo "ABORTA: DB_NAME='$DB_NAME' no termina en _test (este script borra la base)" >&2; exit 2;; esac
ROOT=$(cd "$(dirname "$0")/../../../../.." && pwd)
Q="psql -q -h $DB_HOST -p $DB_PORT -U $DB_USER"
$Q -d postgres -c "drop database if exists $DB_NAME" -c "create database $DB_NAME"
cd "$ROOT/database/SQL"
for f in 00_shared/00_types.sql 01_iam/01_schema.sql 01_iam/02_tables.sql 03_terminology/01_schema.sql 03_terminology/02_tables.sql 03_terminology/03_fk_intra.sql 03_terminology/04_indexes.sql 03_terminology/90_fk_deferred.sql; do
  $Q -d "$DB_NAME" -f "$f" >/dev/null 2>&1 || true
done
cd "$ROOT" && node tools/terminology-import/specialty-services/test/disposable-db/seed.mjs
