#!/bin/bash
# Sonda de disponibilidad vista desde el propio Traefik.
# Cada 2 s pide cada URL; anota SÓLO lo que no es 200, más un latido por hora
# con el conteo. Sirve para medir si un despliegue se notó.
#   - /auth de demo y test: lo sirve el front (failover de Traefik).
#   - una ruta de API por el front de test: la sirve la API detrás del nginx
#     (respaldo `alovida-api-standby`), así se mide también el despliegue de la API.
LOG=/var/log/alovida-uptime.log
URLS="demo.alovidasalud.arauzsoftware.com/auth
test.62.169.18.132.sslip.io/auth
test.62.169.18.132.sslip.io/terminology/value-sets?code=VS_BO_DEPARTMENT"
ok=0; last=$(date +%H)
while true; do
  for u in $URLS; do
    h="${u%%/*}"
    r=$(curl -sk -o /dev/null -m 5 -w '%{http_code}' --resolve "$h:443:127.0.0.1" "https://$u")
    if [ "$r" = 200 ]; then ok=$((ok + 1)); else printf '%s FALLO %s %s\n' "$(date -u +%FT%TZ)" "$u" "$r" >>"$LOG"; fi
  done
  if [ "$(date +%H)" != "$last" ]; then printf '%s latido %d respuestas 200\n' "$(date -u +%FT%TZ)" "$ok" >>"$LOG"; ok=0; last=$(date +%H); fi
  sleep 2
done
