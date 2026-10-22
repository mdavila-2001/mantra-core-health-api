#!/usr/bin/env bash
# =========================================================================
# Mantra Core Technologies · ALOVIDA Health Ecosystem
# Verificación extremo a extremo de la trazabilidad distribuida.
#
# Comprueba, contra servicios REALES y sin simular nada, que:
#   1. Jaeger está arriba y su API responde.
#   2. El backend está arriba.
#   3. Una petición de negocio devuelve la cabecera `x-trace-id`.
#   4. Esa traza concreta llega a Jaeger y se puede recuperar por su id.
#   5. La traza contiene spans del servicio esperado.
#   6. La traza NO contiene cabeceras de autenticación ni cuerpos.
#   7. Una petición a `/health` NO genera traza (exclusión efectiva).
#
# Uso:
#   yarn jaeger:up            # levanta Jaeger
#   OTEL_ENABLED=true yarn start:dev   # backend con telemetría
#   yarn jaeger:verify        # este script
#
# Variables:
#   API_BASE_URL     (por defecto http://localhost:3000)
#   JAEGER_BASE_URL  (por defecto http://localhost:16686)
#   SERVICE_NAME     (por defecto alovida-api)
#
# Dependencias: bash, curl y jq. `jq` no viene de serie en todos los sistemas:
#   macOS: brew install jq   ·   Debian/Ubuntu: apt-get install -y jq
# =========================================================================
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
JAEGER_BASE_URL="${JAEGER_BASE_URL:-http://localhost:16686}"
SERVICE_NAME="${SERVICE_NAME:-alovida-api}"
# Las trazas se exportan por lotes: hay que darle al BatchSpanProcessor tiempo
# de vaciar antes de preguntar por ellas. No es una carrera, es el diseño.
MAX_WAIT_SECONDS="${MAX_WAIT_SECONDS:-30}"

pass() { printf '  \033[32mOK\033[0m   %s\n' "$1"; }
fail() { printf '  \033[31mFALLO\033[0m %s\n' "$1"; exit 1; }
info() { printf '\n\033[1m%s\033[0m\n' "$1"; }

info "0. Herramientas requeridas"
command -v curl >/dev/null || fail "curl no está instalado"
command -v jq >/dev/null || fail "jq no está instalado (macOS: brew install jq)"
pass "curl y jq disponibles"

info "1. Jaeger responde"
if ! curl -sf "${JAEGER_BASE_URL}/api/services" >/dev/null; then
  fail "Jaeger no responde en ${JAEGER_BASE_URL}. ¿Ejecutaste 'yarn jaeger:up'?"
fi
pass "API de Jaeger disponible en ${JAEGER_BASE_URL}"

info "2. El backend responde"
if ! curl -sf "${API_BASE_URL}/health" >/dev/null; then
  fail "El backend no responde en ${API_BASE_URL}. ¿Está arrancado?"
fi
pass "Backend disponible en ${API_BASE_URL}"

info "3. Una petición de negocio devuelve x-trace-id"
# Se usa un login con credenciales inválidas: ejercita el camino completo
# (controller -> servicio -> span de negocio 'iam.authenticate' -> PostgreSQL)
# sin necesitar un usuario sembrado ni un token previo, y sin crear datos.
HEADERS_FILE="$(mktemp)"
trap 'rm -f "${HEADERS_FILE}"' EXIT
curl -s -o /dev/null -D "${HEADERS_FILE}" \
  -X POST "${API_BASE_URL}/iam/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify-jaeger@example.invalid","password":"credencial-invalida"}' \
  || true

TRACE_ID="$(grep -i '^x-trace-id:' "${HEADERS_FILE}" | tr -d '\r' | awk '{print $2}')"
if [ -z "${TRACE_ID}" ]; then
  fail "La respuesta no trajo x-trace-id. ¿Arrancó el backend con OTEL_ENABLED=true?"
fi
pass "x-trace-id = ${TRACE_ID}"

info "4. La traza llega a Jaeger"
FOUND=""
for _ in $(seq 1 "${MAX_WAIT_SECONDS}"); do
  if curl -sf "${JAEGER_BASE_URL}/api/traces/${TRACE_ID}" \
    | jq -e '.data | length > 0' >/dev/null 2>&1; then
    FOUND="yes"
    break
  fi
  sleep 1
done
[ -n "${FOUND}" ] || fail "La traza ${TRACE_ID} no apareció en Jaeger tras ${MAX_WAIT_SECONDS}s"
pass "Traza ${TRACE_ID} recuperada de Jaeger"

TRACE_JSON="$(curl -sf "${JAEGER_BASE_URL}/api/traces/${TRACE_ID}")"

info "5. La traza contiene los spans esperados"
SPAN_COUNT="$(echo "${TRACE_JSON}" | jq '[.data[].spans[]] | length')"
[ "${SPAN_COUNT}" -gt 0 ] || fail "La traza no tiene spans"
pass "${SPAN_COUNT} spans en la traza"

if echo "${TRACE_JSON}" | jq -e \
  --arg svc "${SERVICE_NAME}" \
  '[.data[].processes | to_entries[] | .value.serviceName] | index($svc)' >/dev/null; then
  pass "El servicio ${SERVICE_NAME} aparece en la traza"
else
  fail "El servicio ${SERVICE_NAME} no aparece en la traza"
fi

if echo "${TRACE_JSON}" | jq -e \
  '[.data[].spans[].operationName] | index("iam.authenticate")' >/dev/null; then
  pass "El span de negocio 'iam.authenticate' está presente"
else
  fail "Falta el span de negocio 'iam.authenticate'"
fi

info "6. La traza no contiene información sensible"
LEAKS="$(echo "${TRACE_JSON}" | jq -r \
  '[.data[].spans[].tags[] | select(
      (.key | ascii_downcase | test("authorization|cookie|password|secret|token"))
      or (.value | tostring | test("credencial-invalida"))
    ) | .key] | unique | join(", ")')"
[ -z "${LEAKS}" ] || fail "Atributos sensibles presentes en la traza: ${LEAKS}"
pass "Sin credenciales, cabeceras de autenticación ni cuerpos en los atributos"

info "7. /health está excluido de las trazas"
curl -sf "${API_BASE_URL}/health" >/dev/null
sleep 3
HEALTH_SPANS="$(curl -sf "${JAEGER_BASE_URL}/api/traces?service=${SERVICE_NAME}&operation=GET%20%2Fhealth&limit=1" \
  | jq '.data | length')"
[ "${HEALTH_SPANS}" -eq 0 ] || fail "La sonda /health está generando trazas"
pass "Ninguna traza para /health"

info "Resultado"
printf '  Trazabilidad verificada extremo a extremo.\n'
printf '  Ver la traza en: %s/trace/%s\n\n' "${JAEGER_BASE_URL}" "${TRACE_ID}"
