#!/bin/bash
# Pasa las bases de la API de un entorno del compose de Coolify al stack propio
# (docker-compose.yml de esta carpeta). Corre EN EL VPS, como root.
#
#   switchover.sh test            hace el cambio (corte de la API: ~1 min)
#   switchover.sh test rollback   vuelve a las bases de Coolify
#
# Qué hace, en orden:
#   1. Se niega si hay un despliegue de la API EN EJECUCIÓN o si el stack ya existe.
#      Uno en cola no molesta: construye primero (~10 min) y el cambio tarda
#      menos; además es el despliegue que tiene que correr después.
#   2. Apaga el autodeploy de la API de ese entorno (lo reenciende quien mergea
#      el compose con el perfil `embedded-data`; ver README).
#   3. Anota conteos de control en postgres y mongo.
#   4. Para los contenedores de datos de Coolify y les quita el reinicio
#      automático: si no, un reinicio del servidor los levantaría otra vez con
#      los mismos alias que el stack nuevo.
#   5. Crea el stack, COPIA los volúmenes (los de Coolify quedan intactos: son
#      el backup del cambio y el camino de vuelta) y lo levanta esperando a que
#      esté sano.
#   6. Compara los conteos y deja la marca que activa la baranda del
#      reconciliador (alovida-standby para cualquier base de Coolify que vuelva).
set -euo pipefail

ENVNAME="${1:?entorno: test}"
ACTION="${2:-switch}"
case "$ENVNAME" in
  test) UUID=n0qpr7taqbkh3enyyoiumj9a ;;
  *) echo "entorno desconocido: $ENVNAME" >&2; exit 2 ;;
esac
PROJECT="alovida-data-$ENVNAME"
DIR=/opt/alovida-data-stack
ENVF="/etc/alovida-resilience/data-$ENVNAME.env"
STATE=/var/lib/alovida-resilience
MARK="$STATE/data-$ENVNAME.active"
SERVICES="postgres mongodb redis opensearch minio"
LOG=/var/log/alovida-resilience.log
log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "switchover $ENVNAME: $*" | tee -a "$LOG"; }

coolify_container() { docker ps -a --filter "name=^$1-$UUID-" --format '{{.Names}}' | sort | tail -1; }
compose() { docker compose -p "$PROJECT" -f "$DIR/docker-compose.yml" --env-file "$ENVF" "$@"; }
db() { docker exec coolify-db psql -U coolify -d coolify -tAc "$1"; }

# Conteos que no se mueven con el uso normal (tablas, conceptos, usuarios), así
# una escritura entre la lectura y la parada no da un falso «no coincide».
pg_counts() {
  docker exec -i "$1" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA' <<'SQL'
select (select count(*) from information_schema.tables
          where table_schema not in ('pg_catalog', 'information_schema'))
       || ' tablas / ' || (select count(*) from terminology.catalog_concepts)
       || ' conceptos / ' || (select count(*) from iam.users) || ' usuarios';
SQL
}
mongo_counts() {
  docker exec "$1" mongosh --quiet --eval 'db.adminCommand({listDatabases:1}).databases.map(d=>d.name+":"+d.sizeOnDisk).join(" ")'
}

rollback() {
  log "ROLLBACK: bajando $PROJECT (sin borrar volúmenes) y levantando las bases de Coolify"
  rm -f "$MARK"
  compose down || true
  for s in $SERVICES; do
    c="$(coolify_container "$s")"
    [ -n "$c" ] && docker update --restart=always "$c" >/dev/null && docker start "$c" >/dev/null && log "arrancado $c"
  done
  log "rollback hecho. El autodeploy de api-$ENVNAME sigue apagado: $STATE/autodeploy/api-$ENVNAME.disabled"
}

[ "$ACTION" = "rollback" ] && { rollback; exit 0; }

# --- 1. barandas -------------------------------------------------------------
[ -f "$DIR/docker-compose.yml" ] || { echo "falta $DIR/docker-compose.yml" >&2; exit 3; }
[ -f "$ENVF" ] || { echo "falta $ENVF" >&2; exit 3; }
[ -f "$MARK" ] && { echo "ya está hecho ($MARK existe)" >&2; exit 4; }
[ -z "$(compose ps -aq 2>/dev/null)" ] || { echo "el stack $PROJECT ya tiene contenedores" >&2; exit 4; }
busy="$(db "select count(*) from application_deployment_queues q join applications a on a.id::text=q.application_id where a.uuid='$UUID' and q.status = 'in_progress'")"
[ "$busy" = "0" ] || { echo "hay un despliegue de la API en curso: esperar" >&2; exit 5; }
PG_OLD="$(coolify_container postgres)"; MONGO_OLD="$(coolify_container mongodb)"
[ -n "$PG_OLD" ] && [ -n "$MONGO_OLD" ] || { echo "no encuentro las bases de Coolify" >&2; exit 6; }

# --- 2. autodeploy apagado ----------------------------------------------------
mkdir -p "$STATE/autodeploy"; touch "$STATE/autodeploy/api-$ENVNAME.disabled"
log "autodeploy de api-$ENVNAME apagado durante el cambio"

# --- 3. conteos de control ---------------------------------------------------
BEFORE_PG="$(pg_counts "$PG_OLD")"; BEFORE_MONGO="$(mongo_counts "$MONGO_OLD")"
log "antes: postgres $BEFORE_PG | mongo $BEFORE_MONGO"

# --- 4. parar las bases de Coolify -------------------------------------------
T0=$(date +%s)
for s in $SERVICES; do
  c="$(coolify_container "$s")"; [ -n "$c" ] || continue
  docker update --restart=no "$c" >/dev/null
  docker stop -t 60 "$c" >/dev/null
  log "parado $c"
done

# --- 5. stack nuevo con copia de volúmenes -----------------------------------
compose create >/dev/null 2>&1
for s in $SERVICES; do
  src="${UUID}_${s}-data"; dst="${PROJECT}_${s}_data"
  docker run --rm -v "$src":/from:ro -v "$dst":/to alpine:3.20 sh -c 'cp -a /from/. /to/'
  log "copiado $src -> $dst"
done
if ! compose up -d --wait --wait-timeout 300; then
  log "ERROR: el stack nuevo no quedó sano; vuelvo atrás"
  rollback; exit 7
fi
log "stack $PROJECT sano en $(( $(date +%s) - T0 ))s desde que paré las bases de Coolify"

# --- 6. verificación ---------------------------------------------------------
AFTER_PG="$(pg_counts "$PROJECT-postgres-1")"; AFTER_MONGO="$(mongo_counts "$PROJECT-mongodb-1")"
log "después: postgres $AFTER_PG | mongo $AFTER_MONGO"
if [ "$BEFORE_PG" != "$AFTER_PG" ]; then
  log "ERROR: los conteos de postgres no coinciden; vuelvo atrás"
  rollback; exit 8
fi
touch "$MARK"
log "LISTO. Bases de Coolify paradas (sin reinicio automático) y volúmenes viejos intactos."
