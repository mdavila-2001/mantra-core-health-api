#!/bin/bash
# Corte de la API de dev: del stack manual viejo (05/10) a la app de Coolify.
# Espera a que la API de Coolify esté SANA y sólo entonces apaga la API y los
# workers del stack manual. Las bases del stack manual NO se tocan: siguen
# siendo las de dev. Si la API nueva nunca queda sana, no apaga nada.
LOG=/var/log/alovida-resilience.log
log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "dev-cutover: $*" >>"$LOG"; }
UUID=zptay3yiynhjtskx4iccivqt
for i in $(seq 1 240); do   # hasta 60 min
  A=$(docker ps --filter "name=^api-$UUID-" --format '{{.Names}}' | sort | tail -1)
  if [ -n "$A" ] && [ "$(docker inspect -f '{{.State.Health.Status}}' "$A" 2>/dev/null)" = healthy ]; then
    log "API nueva sana ($A); apago API y workers del stack manual"
    for c in alovida-api-dev-api-1 alovida-api-dev-worker-messaging-1 alovida-api-dev-worker-read_models-1 alovida-api-dev-worker-scheduling-1 alovida-api-dev-worker-workflow-1; do
      docker update --restart=no "$c" >/dev/null 2>&1; docker stop -t 30 "$c" >/dev/null 2>&1 && log "parado $c"
    done
    exit 0
  fi
  sleep 15
done
log "la API nueva no quedó sana en 60 min: NO se apagó nada del stack manual"
exit 1
