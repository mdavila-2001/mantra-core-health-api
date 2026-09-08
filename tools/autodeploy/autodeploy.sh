#!/usr/bin/env bash
# Auto-despliegue de la API ante commits nuevos en `dev`.
#
# ## Por qué existe
#
# El front de ALOVIDA ya se redesplegaba solo, pero la API no tenía nada: la imagen
# `mantra-redesa-api:local` que sirven la API y sus 23 workers se construía a mano y ahí se
# quedaba. El resultado es la peor forma de estar roto —la que no lo parece—: el enlace de
# demostración sirve el `dev` de hace un minuto contra una API de hace días, y lo que falla
# se lee como un error de producto y no como un despliegue viejo.
#
# ## Las decisiones
#
# **No toca tu copia de trabajo.** Construye desde un `git worktree` desprendido en el commit
# remoto. Tu árbol puede estar en `pablo/loquesea` con cambios a medias: esto ni lo mira. Es lo
# contrario de lo que hace el redespliegue del front, que rebasa la rama local — allí tiene
# sentido porque la rama ES el despliegue; aquí no.
#
# **Una sola imagen, 24 servicios.** La API y los 23 workers comparten `mantra-redesa-api:local`,
# así que un commit los cambia a todos. Se despliega en dos tiempos: primero la API sola, y sólo
# si contesta sana se recrean los workers. Si no arranca, se vuelve a la imagen anterior y los
# workers ni se enteran.
#
# **`--no-deps` siempre.** El compose declara `postgres-init` con
# `condition: service_completed_successfully`, y en esta máquina esa inicialización no termina
# nunca. Sin `--no-deps`, cada despliegue se quedaría esperando a un trabajo que no acaba.
#
# ## Uso
#
#   tools/autodeploy/autodeploy.sh una-vez   # una pasada (lo que llama systemd)
#   tools/autodeploy/autodeploy.sh systemd   # instala el temporizador de usuario
#   tools/autodeploy/autodeploy.sh estado    # qué commit sirve y con qué salud
#   tools/autodeploy/autodeploy.sh logs      # las últimas líneas del diario
#   tools/autodeploy/autodeploy.sh parar     # desactiva el temporizador (no toca contenedores)
#
# Se ajusta por entorno: AUTODEPLOY_RAMA, AUTODEPLOY_ESPERA_SANO.
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ESTADO="$RAIZ/tools/autodeploy/estado"
mkdir -p "$ESTADO"
LOG="$ESTADO/autodeploy.log"

REMOTO="${AUTODEPLOY_REMOTO:-origin}"
RAMA="${AUTODEPLOY_RAMA:-dev}"
IMAGEN="mantra-redesa-api"
ETIQUETA_VIVA="$IMAGEN:local"          # la que nombra el compose; se reapunta en cada despliegue
ESPERA_SANO="${AUTODEPLOY_ESPERA_SANO:-180}"
TRABAJO="$ESTADO/arbol"                # el worktree desprendido; se crea y se borra en cada pasada

log() { printf '%s | %s\n' "$(date -Is)" "$*" | tee -a "$LOG"; }

compose() { docker compose -f "$RAIZ/docker-compose.yml" "$@"; }

# Los servicios que comparten la etiqueta viva, leídos del compose y no de una lista escrita a
# mano: el día que alguien añada el worker número 24, esto lo despliega sin que nadie se acuerde.
servicios_de_la_imagen() {
  compose config --format json 2>/dev/null \
    | jq -r --arg img "$ETIQUETA_VIVA" '.services | to_entries[] | select(.value.image == $img) | .key'
}

esperar_sano() {
  local servicio="$1" limite="$ESPERA_SANO" id estado
  while [ "$limite" -gt 0 ]; do
    id="$(compose ps -q "$servicio" 2>/dev/null | head -1)"
    if [ -n "$id" ]; then
      estado="$(docker inspect "$id" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' 2>/dev/null)"
      case "$estado" in
        healthy|running) [ "$estado" = "healthy" ] && return 0 ;;
        exited|dead) log "[$servicio] el contenedor murió ($estado)"; return 1 ;;
      esac
    fi
    sleep 5; limite=$((limite - 5))
  done
  log "[$servicio] no llegó a sano en ${ESPERA_SANO}s"
  return 1
}

desplegar() {
  local sha="$1" corto="${1:0:12}" anterior
  rm -rf "$TRABAJO"
  git -C "$RAIZ" worktree prune >/dev/null 2>&1
  git -C "$RAIZ" worktree add -q --detach "$TRABAJO" "$sha" 2>>"$LOG" || {
    log "no pude crear el worktree en $corto"; return 1; }

  log "construyendo $IMAGEN:$corto"
  # `--network=host`: el DNS que Docker copia a los contenedores (192.168.0.1) no
  # responde desde los puentes, así que `apt-get` y `yarn` mueren por timeout. Con la
  # red del anfitrión la construcción resuelve por systemd-resolved y sí sale a internet.
  if ! docker build -q --network=host -f "$TRABAJO/Dockerfile" -t "$IMAGEN:$corto" \
        --build-arg GIT_COMMIT="$sha" \
        --build-arg BUILD_TIME="$(date -Is)" \
        "$TRABAJO" >>"$LOG" 2>&1; then
    log "✗ la construcción falló; nada se toca (sigue sirviendo $(cat "$ESTADO/COMMIT_DESPLEGADO" 2>/dev/null || echo 'lo de antes'))"
    git -C "$RAIZ" worktree remove --force "$TRABAJO" >/dev/null 2>&1
    return 1
  fi

  # La imagen anterior por su id, no por su nombre: en cuanto se reapunta la etiqueta viva, el
  # nombre deja de significar lo de antes y sin el id no habría a dónde volver.
  anterior="$(docker image inspect "$ETIQUETA_VIVA" --format '{{.Id}}' 2>/dev/null)"
  docker tag "$IMAGEN:$corto" "$ETIQUETA_VIVA"

  log "cambiando la API a $corto"
  compose up -d --no-deps api >>"$LOG" 2>&1
  if ! esperar_sano api; then
    if [ -n "$anterior" ]; then
      log "✗ la API no levantó con $corto; volviendo a la imagen anterior"
      docker tag "$anterior" "$ETIQUETA_VIVA"
      compose up -d --no-deps api >>"$LOG" 2>&1
      esperar_sano api && log "restaurada la anterior; la API sigue en pie"
    else
      log "✗ la API no levantó con $corto y no hay imagen anterior a la que volver"
    fi
    git -C "$RAIZ" worktree remove --force "$TRABAJO" >/dev/null 2>&1
    return 1
  fi

  # Los workers sólo después de que la API haya contestado sana: si el commit rompe el arranque,
  # el fallo queda en un contenedor y no en veinticuatro.
  local trabajadores
  mapfile -t trabajadores < <(servicios_de_la_imagen | grep -v '^api$')
  if [ "${#trabajadores[@]}" -gt 0 ]; then
    log "recreando ${#trabajadores[@]} workers con $corto"
    compose up -d --no-deps "${trabajadores[@]}" >>"$LOG" 2>&1
  fi

  echo "$sha" > "$ESTADO/COMMIT_DESPLEGADO"
  log "✓ $corto en línea — API y ${#trabajadores[@]} workers"
  git -C "$RAIZ" worktree remove --force "$TRABAJO" >/dev/null 2>&1
  git -C "$RAIZ" worktree prune >/dev/null 2>&1

  # Las imágenes viejas se acumulan a 660 MB por commit. Se conservan las tres últimas por si
  # hace falta volver a mano a una de ayer.
  #
  # Es limpieza de mejor esfuerzo y su resultado NO decide el del despliegue: una de esas etiquetas
  # puede seguir referenciada por un contenedor de otro proyecto, y entonces `docker rmi` falla. Sin
  # el `return 0` de abajo, ese fallo era el valor de retorno de la función —la última orden de un
  # cuerpo sin `return` explícito— y `una_vez` anotaba como fallido un commit que estaba sirviendo
  # bien, dejando el despliegue congelado hasta que `dev` avanzara.
  docker images "$IMAGEN" --format '{{.Tag}} {{.ID}}' | grep -v '^local ' | tail -n +4 \
    | while read -r _ id; do docker rmi "$id" >/dev/null 2>&1; done

  return 0
}

# Un `fetch` falla por dos motivos que piden respuestas opuestas: se cayó la red —se cura sola y
# no hay nada que hacer— o la credencial dejó de valer —no se cura nunca y hace falta una persona—.
# Meter las dos en el mismo saco («sin red o sin remoto») es lo que dejó el despliegue congelado
# 32 h el 04/09/2026: el token de `gh` se invalidó, cada pasada anotó la misma línea tranquila
# 1072 veces, y la API siguió sirviendo el commit de anteayer con `/health` en 200.
fallo_de_fetch() {
  local motivo="$1" detalle="$2" n
  n=$(( $(cat "$ESTADO/FALLOS_FETCH" 2>/dev/null || echo 0) + 1 ))
  echo "$n" > "$ESTADO/FALLOS_FETCH"

  # Ruidoso la primera pasada y luego una vez por hora. Es la única señal de que el despliegue
  # está parado: los contenedores viejos siguen en pie contestando 200 tan campantes.
  local grita=0
  { [ "$n" -eq 1 ] || [ $((n % 30)) -eq 0 ]; } && grita=1

  if [ "$motivo" = credencial ]; then
    if [ "$grita" = 1 ]; then
      log "✗✗ CREDENCIAL INVÁLIDA — EL DESPLIEGUE ESTÁ PARADO Y NO SE CURA SOLO (pasada $n)"
      log "   sigue sirviendo $(cut -c1-12 "$ESTADO/COMMIT_DESPLEGADO" 2>/dev/null || echo '—')"
      log "   se arregla con: gh auth login -h github.com"
    else
      log "✗ credencial inválida; el despliegue sigue parado (pasada $n)"
    fi
  elif [ "$grita" = 1 ]; then
    log "✗ sin acceso a $REMOTO/$RAMA desde hace ~$((n * 2)) min: ${detalle%%$'\n'*}"
  fi
}

# El token de `gh` se comprueba aparte y con límite porque quien se cuelga cuando no vale es el
# propio helper (`gh auth git-credential`), no git: `GIT_TERMINAL_PROMPT=0` sólo apaga el prompt
# de git y no llega a tiempo. Sin esto la pasada se comía el `TimeoutStartSec` de 45 min —que
# está dimensionado para la construcción— y el temporizador se quedaba sin reprogramar (`n/a`).
# Sólo aplica al caso en que la credencial ES la de `gh`: con remoto SSH no hay nada que mirar.
credencial_rota() {
  command -v gh >/dev/null 2>&1 || return 1
  git -C "$RAIZ" remote get-url "$REMOTO" 2>/dev/null | grep -q '^https://github.com/' || return 1
  ! timeout 20 gh auth status -h github.com >/dev/null 2>&1
}

una_vez() {
  exec 9>"$ESTADO/una-vez.lock"
  flock -n 9 || { log "PASADA: ya hay una en curso; esta se retira"; exit 0; }

  if credencial_rota; then
    fallo_de_fetch credencial ""
    exit 0
  fi

  local salida_fetch
  if ! salida_fetch="$(GIT_TERMINAL_PROMPT=0 timeout 120 git -C "$RAIZ" fetch -q "$REMOTO" "$RAMA" 2>&1)"; then
    printf '%s\n' "$salida_fetch" >> "$LOG"
    case "$salida_fetch" in
      *"could not read Username"*|*"Authentication failed"*|*"terminal prompts disabled"*)
        fallo_de_fetch credencial "$salida_fetch" ;;
      *)
        fallo_de_fetch red "$salida_fetch" ;;
    esac
    exit 0
  fi
  rm -f "$ESTADO/FALLOS_FETCH"
  local remoto desplegado fallido
  remoto="$(git -C "$RAIZ" rev-parse "$REMOTO/$RAMA" 2>/dev/null)" || exit 0
  desplegado="$(cat "$ESTADO/COMMIT_DESPLEGADO" 2>/dev/null || echo '')"
  [ "$remoto" = "$desplegado" ] && exit 0

  # Un commit que ya demostró que no arranca no se reintenta cada dos minutos: sería recrear la
  # API y deshacerla en bucle, con el ruido y el riesgo que eso trae, para llegar siempre al mismo
  # sitio. Se anota y se espera a que `dev` avance —que es lo que de verdad puede arreglarlo—.
  fallido="$(cat "$ESTADO/COMMIT_FALLIDO" 2>/dev/null || echo '')"
  if [ "$remoto" = "$fallido" ]; then
    exit 0
  fi

  log "commit nuevo en $RAMA: ${desplegado:0:12}..${remoto:0:12}"
  if desplegar "$remoto"; then
    rm -f "$ESTADO/COMMIT_FALLIDO"
  else
    echo "$remoto" > "$ESTADO/COMMIT_FALLIDO"
    log "anotado ${remoto:0:12} como fallido; no se reintenta hasta que $RAMA avance"
  fi
}

case "${1:-estado}" in
  una-vez) una_vez ;;

  systemd)
    UNIDADES="$HOME/.config/systemd/user"
    mkdir -p "$UNIDADES"
    ln -sf "$RAIZ/tools/autodeploy/systemd/alovida-api-autodeploy.service" "$UNIDADES/"
    ln -sf "$RAIZ/tools/autodeploy/systemd/alovida-api-autodeploy.timer"   "$UNIDADES/"
    systemctl --user daemon-reload
    systemctl --user enable --now alovida-api-autodeploy.timer >/dev/null 2>&1
    # Sin linger, las unidades de usuario mueren al cerrar sesión: el despliegue volvería a
    # depender de que alguien haya entrado a la máquina.
    loginctl enable-linger "$USER" >/dev/null 2>&1 \
      && log "SYSTEMD: linger activo — corre aunque nadie inicie sesión" \
      || log "SYSTEMD: ⚠ no se pudo activar linger"
    log "SYSTEMD: temporizador instalado ($(systemctl --user is-active alovida-api-autodeploy.timer))"
    systemctl --user list-timers alovida-api-autodeploy.timer --no-pager
    ;;

  parar)
    systemctl --user disable --now alovida-api-autodeploy.timer >/dev/null 2>&1
    log "SYSTEMD: temporizador desactivado; los contenedores siguen como están"
    ;;

  estado)
    git -C "$RAIZ" fetch -q "$REMOTO" "$RAMA" 2>/dev/null
    echo "rama vigilada : $REMOTO/$RAMA @ $(git -C "$RAIZ" rev-parse --short "$REMOTO/$RAMA" 2>/dev/null)"
    echo "desplegado    : $(cut -c1-12 "$ESTADO/COMMIT_DESPLEGADO" 2>/dev/null || echo '—')"
    [ -s "$ESTADO/COMMIT_FALLIDO" ] && echo "no arranca    : $(cut -c1-12 "$ESTADO/COMMIT_FALLIDO") ⚠ (se reintenta cuando $RAMA avance)"
    echo "imagen viva   : $(docker image inspect "$ETIQUETA_VIVA" --format '{{.Id}}' 2>/dev/null | cut -c8-19)"
    echo "temporizador  : $(systemctl --user is-active alovida-api-autodeploy.timer 2>/dev/null)"
    echo "API           : 127.0.0.1:${PORT:-3000}/health → $(curl -s -o /dev/null -w '%{http_code}' -m 5 "http://127.0.0.1:${PORT:-3000}/health" 2>/dev/null)"
    echo "servicios     : $(servicios_de_la_imagen | wc -l) usan $ETIQUETA_VIVA"
    docker ps --filter "ancestor=$ETIQUETA_VIVA" --format '{{.Names}}\t{{.Status}}' | head -5
    echo "  (…)"
    ;;

  logs) tail -n "${2:-40}" "$LOG" ;;

  *) sed -n '2,32p' "$0"; exit 1 ;;
esac
