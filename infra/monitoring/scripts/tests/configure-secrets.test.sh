#!/usr/bin/env bash
# Prueba de configure-secrets.sh (IC-01) con un sustituto local de `curl`:
# no contacta Coolify ni Telegram.
#
#   bash infra/monitoring/scripts/tests/configure-secrets.test.sh
#
# Comprueba que (1) se rechaza un COOLIFY_URL http:// remoto o ausente, (2) se
# aceptan https:// y http:// hacia loopback, y (3) ningún secreto aparece en los
# argumentos de curl: sólo en la configuración que recibe por stdin.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HERE/../configure-secrets.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
FAILS=0

ok()   { echo "  ok    $1"; }
fail() { echo "  FALLA $1" >&2; FAILS=$((FAILS + 1)); }

# --- curl falso: registra argv y stdin, responde lo mínimo que el script lee ---
mkdir -p "$WORK/bin"
cat > "$WORK/bin/curl" <<'FAKE'
#!/usr/bin/env bash
n="$(( $(cat "$FAKE_LOG/.n" 2>/dev/null || echo 0) + 1 ))"
echo "$n" > "$FAKE_LOG/.n"
printf '%s\n' "$@" > "$FAKE_LOG/$n.argv"
cfg="$(cat)"
printf '%s\n' "$cfg" > "$FAKE_LOG/$n.cfg"
# Si la configuración referencia un archivo de cuerpo, se conserva su contenido.
body="$(printf '%s\n' "$cfg" | sed -n 's/^data = "@\(.*\)"$/\1/p')"
[ -z "$body" ] || cp "$body" "$FAKE_LOG/$n.body" 2>/dev/null
case "$cfg" in
  *"/getMe"*)      echo '{"ok":true,"result":{"username":"bot_sintetico"}}' ;;
  *"/getUpdates"*) echo '{"ok":true,"result":[{"message":{"chat":{"id":-100123,"type":"group","title":"Avisos"}}}]}' ;;
esac
exit 0
FAKE
chmod +x "$WORK/bin/curl"

BOT_SECRET='111111:BOT-SECRETO-SINTETICO'
COOLIFY_SECRET='COOLIFY-TOKEN-SINTETICO-777'
printf "COOLIFY_TOKEN='%s'\n" "$COOLIFY_SECRET" > "$WORK/coolify.env"

run_script() { # run_script <COOLIFY_URL|-> -> código de salida; deja stderr en $WORK/err
  local url="$1"
  rm -rf "$WORK/log"; mkdir -p "$WORK/log"
  printf '%s\n\n' "$BOT_SECRET" | env COOLIFY_URL="$url" \
    PATH="$WORK/bin:$PATH" FAKE_LOG="$WORK/log" COOLIFY_ENV_FILE="$WORK/coolify.env" \
    bash "$SCRIPT" uuid-sintetico >"$WORK/out" 2>"$WORK/err"
}

echo "URL rechazada"
mkdir -p "$WORK/log"
env -u COOLIFY_URL PATH="$WORK/bin:$PATH" FAKE_LOG="$WORK/log" \
  COOLIFY_ENV_FILE="$WORK/coolify.env" bash "$SCRIPT" uuid-sintetico </dev/null >/dev/null 2>"$WORK/err" \
  && fail "sin COOLIFY_URL debía abortar" || { grep -q COOLIFY_URL "$WORK/err" && ok "sin COOLIFY_URL aborta"; }
for bad in "http://coolify.ejemplo.org:8000" "http://173.249.39.237:8000" "http://localhost:80@evil.example" "ftp://x" "http://"; do
  if run_script "$bad"; then fail "debía rechazar $bad"; else
    if grep -q "COOLIFY_URL debe ser https" "$WORK/err" && [ -z "$(ls "$WORK/log"/*.argv 2>/dev/null)" ]; then
      ok "rechaza $bad sin llamar a curl"
    else
      fail "rechazo incorrecto de $bad: $(cat "$WORK/err")"
    fi
  fi
done

echo "URL aceptada"
for good in "https://coolify.ejemplo.org" "https://coolify.ejemplo.org:8443/" "http://localhost:8000" "http://127.0.0.1:8000" "http://[::1]:8000"; do
  if run_script "$good"; then ok "acepta $good"; else fail "debía aceptar $good: $(cat "$WORK/err")"; fi
done

echo "Secretos fuera de los argumentos"
run_script "https://coolify.ejemplo.org" || fail "ejecución completa falló: $(cat "$WORK/err")"
calls="$(ls "$WORK/log"/*.argv 2>/dev/null | wc -l)"
[ "$calls" -ge 5 ] && ok "se hicieron $calls llamadas a curl" || fail "pocas llamadas a curl ($calls)"
if cat "$WORK"/log/*.argv 2>/dev/null | grep -qE "$COOLIFY_SECRET|BOT-SECRETO|Bearer|Authorization|coolify.ejemplo.org"; then
  fail "hay datos sensibles o URLs en los argumentos de curl"
else
  ok "los argumentos de curl sólo llevan -K -"
fi
grep -q "Authorization: Bearer $COOLIFY_SECRET" "$WORK"/log/*.cfg && ok "el token viaja por la configuración (stdin)" || fail "el token no llegó por stdin"
grep -l '^url = "https://coolify.ejemplo.org/api/v1/applications/uuid-sintetico/envs/bulk"' "$WORK"/log/*.cfg >/dev/null \
  && ok "PATCH a la URL https de Coolify" || fail "no se llamó al endpoint de variables"
grep -q 'GRAFANA_ADMIN_PASSWORD' "$WORK"/log/*.body && ok "el cuerpo viaja por archivo, no por argumento" || fail "no se capturó el cuerpo"
tmpfile="$(sed -n 's/^data = "@\(.*\)"$/\1/p' "$WORK"/log/*.cfg | head -1)"
[ -n "$tmpfile" ] && [ ! -e "$tmpfile" ] && ok "el archivo temporal con secretos se borra" || fail "quedó el archivo temporal"

echo
if [ "$FAILS" -eq 0 ]; then echo "configure-secrets: todo en verde"; else echo "configure-secrets: $FAILS fallas" >&2; exit 1; fi
