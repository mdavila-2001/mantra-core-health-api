#!/bin/bash
# Sonda de disponibilidad vista desde el propio Traefik.
# Cada 2 s pide cada URL; anota SÓLO lo que no es 200, más un latido por hora.
#   - /auth de demo y prod: lo sirve el front (failover de Traefik).
#   - una ruta de API por el front de prod: la API detrás del nginx (respaldo
#     `alovida-api-standby`), así se mide también el despliegue de la API.
# Alerta por Telegram (vía alovida-autodeploy) cuando una URL falla
# $ALERT_AFTER veces seguidas, y otra vez cuando se recupera: un aviso por
# incidente, no uno por fallo.
LOG=/var/log/alovida-uptime.log
ALERT_AFTER="${ALERT_AFTER:-3}"
URLS="demo.alovidasalud.arauzsoftware.com/auth
app.alovidasalud.com/auth
app.alovidasalud.com/terminology/value-sets?code=VS_BO_DEPARTMENT"
declare -A streak down
ok=0; last=$(date +%H)
alert() { /usr/local/sbin/alovida-autodeploy --test-alert "$1" >/dev/null 2>&1 & }
while true; do
  for u in $URLS; do
    h="${u%%/*}"
    r=$(curl -sk -o /dev/null -m 5 -w '%{http_code}' --resolve "$h:443:127.0.0.1" "https://$u")
    if [ "$r" = 200 ]; then
      ok=$((ok + 1))
      if [ "${down[$u]:-}" ]; then
        alert "✅ AloVida: volvió https://$u (estuvo caído desde ${down[$u]} UTC)."
        printf '%s RECUPERADO %s\n' "$(date -u +%FT%TZ)" "$u" >>"$LOG"
        unset 'down[$u]'
      fi
      streak[$u]=0
    else
      printf '%s FALLO %s %s\n' "$(date -u +%FT%TZ)" "$u" "$r" >>"$LOG"
      streak[$u]=$(( ${streak[$u]:-0} + 1 ))
      if [ "${streak[$u]}" -eq "$ALERT_AFTER" ]; then
        down[$u]="$(date -u +%T)"
        alert "🔴 AloVida caído: https://$u no responde ($ALERT_AFTER intentos seguidos, último: $r)."
      fi
    fi
  done
  if [ "$(date +%H)" != "$last" ]; then printf '%s latido %d respuestas 200\n' "$(date -u +%FT%TZ)" "$ok" >>"$LOG"; ok=0; last=$(date +%H); fi
  sleep 2
done
