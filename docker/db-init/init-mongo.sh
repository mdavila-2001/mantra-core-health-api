#!/usr/bin/env bash
# =========================================================================
# Mantra Core Technologies · REDESA Health Ecosystem
# mongo-init: crea las colecciones del módulo 55 document_store
# (validadores $jsonSchema + índices) si aún no existen. Idempotente.
# =========================================================================
set -euo pipefail

MONGO_DB="${MONGO_DB:-salud_document_store}"
URI="mongodb://mongodb:27017/${MONGO_DB}"

# document_store.mongodb.js usa createCollection sin guard (falla si la
# colección existe) — centinela: document_envelopes.
if [[ "$(mongosh "$URI" --quiet --eval 'db.getCollectionNames().includes("document_envelopes")')" == "true" ]]; then
    echo "=== document_store: colecciones ya existen en ${MONGO_DB} — skip"
else
    echo ">>> NoSQL 55: document_store (colecciones + \$jsonSchema) en ${MONGO_DB}"
    mongosh "$URI" --quiet /init/mongo/document_store.mongodb.js
fi

echo "=== mongo-init completado"
