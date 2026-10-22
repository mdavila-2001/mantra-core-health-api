#!/bin/sh
# =========================================================================
# Mantra Core Technologies · ALOVIDA Health Ecosystem
# opensearch-init: crea los índices del módulo 57 search_platform desde los
# *.mapping.json (índice = nombre de archivo sin sufijo). Idempotente.
# POSIX sh (corre en curlimages/curl, sin bash).
# =========================================================================
set -eu

OS_URL="${OPENSEARCH_URL:-http://opensearch:9200}"
fail=0

for mapping in /init/os/*.mapping.json; do
    index=$(basename "$mapping" .mapping.json)

    code=$(curl -s -o /dev/null -w '%{http_code}' -I "$OS_URL/$index")
    if [ "$code" = "200" ]; then
        echo "=== $index ya existe — skip"
        continue
    fi

    echo ">>> creando índice $index"
    resp=$(curl -s -X PUT "$OS_URL/$index" -H 'Content-Type: application/json' --data-binary "@$mapping")
    case "$resp" in
        *'"acknowledged":true'*) echo "    OK" ;;
        *) echo "    ERROR en $index: $resp" >&2; fail=1 ;;
    esac
done

if [ "$fail" -ne 0 ]; then
    echo "=== opensearch-init terminó con errores" >&2
    exit 1
fi
echo "=== opensearch-init completado"
