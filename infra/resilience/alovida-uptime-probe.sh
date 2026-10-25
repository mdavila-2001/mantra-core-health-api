#!/bin/bash
# Sonda de disponibilidad de los fronts, vista desde el propio Traefik.
# Cada 2 s pide /auth a cada dominio; anota SÓLO lo que no es 200, más un
# latido por hora con el conteo. Sirve para medir si un despliegue se notó.
LOG=/var/log/alovida-uptime.log
HOSTS="demo.alovidasalud.arauzsoftware.com test.62.169.18.132.sslip.io"
ok=0; last=$(date +%H)
while true; do
  for h in $HOSTS; do
    r=$(curl -sk -o /dev/null -m 5 -w '%{http_code}' --resolve "$h:443:127.0.0.1" "https://$h/auth")
    if [ "$r" = 200 ]; then ok=$((ok + 1)); else printf '%s FALLO %s %s\n' "$(date -u +%FT%TZ)" "$h" "$r" >>"$LOG"; fi
  done
  if [ "$(date +%H)" != "$last" ]; then printf '%s latido %d respuestas 200\n' "$(date -u +%FT%TZ)" "$ok" >>"$LOG"; ok=0; last=$(date +%H); fi
  sleep 2
done
