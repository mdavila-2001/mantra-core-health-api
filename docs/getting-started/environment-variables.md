# Variables de entorno

> Extraído de `.env.example` (fuente real). No se documentan valores de ejemplo sensibles; los
> secretos reales viven fuera del repositorio.

## Base de datos (PostgreSQL / MikroORM)

| Variable | Propósito |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión de aplicación (runtime) |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Conexión administrativa (DDL/migraciones/seed) — ver `docs/security/tenant-isolation.md` sobre por qué deben ser roles distintos |
| `MIKRO_ORM_DEBUG` | Log de queries SQL |
| `ORM_SCHEMA_SYNC` | `off` \| `dry-run` \| `safe` — ver `src/orm/README.md`. `off` es obligatorio al generar documentación (`tools/openapi/generate-openapi.mjs`) para no mutar el esquema de una base compartida |
| `RLS_ENFORCE` | Activa Row-Level Security por tenant — **verificar por entorno**, ver `SEC-001` en `docs/governance/traceability-matrix.md` |

## Otros almacenes

| Variable | Almacén |
|---|---|
| `MONGODB_URI`, `MONGO_DB` | MongoDB (`document_store`) |
| `REDIS_HOST`, `REDIS_PORT` | Redis (`redis_runtime`) |
| `OPENSEARCH_NODE` | OpenSearch (`search_platform`) |
| `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` | MinIO/S3 (`object_storage`) |

## Autenticación

| Variable | Propósito |
|---|---|
| `JWT_SECRET` | Firma de tokens de acceso/refresh |
| `JWT_ACCESS_TTL` | Vida del access token (default `15m`) |
| `JWT_REFRESH_TTL_DAYS` | Vida del refresh token (default `30` días) |
| `ACCOUNT_LOCK_THRESHOLD` | Intentos fallidos antes de bloqueo de cuenta (default `5`) |
| `MFA_ENCRYPTION_KEY` | Cifrado de secretos MFA en reposo |

## Workers

| Variable | Propósito |
|---|---|
| `WORKER_API_BASE_URL` | Base de la API contra la que cada uno de los 20 workers llama endpoints `/internal/*` |
| `WORKER_HTTP_TIMEOUT_MS` | Timeout HTTP del cliente interno de los workers (default `30000`) |
| `MESSAGING_QUEUE_CODES` | Códigos de `messaging.message_queues` que `worker-messaging` drena |
| `MOCK_PROVIDER_BASE_URL`, `MOCK_PROVIDER_API_KEY` | `mock-provider-server` para el adapter mock de proveedores (notificaciones, borrado cross-store, embeddings) |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`, `GOOGLE_SENDER_EMAIL` | Proveedor real de email (Gmail API) del canal EMAIL de `messaging`, gana sobre el mock si ambos están configurados — ver [guía de configuración](../operations/gmail-provider-setup.md) |

## Otras

| Variable | Propósito |
|---|---|
| `PORT` | Puerto HTTP de la API (default `3000`) |
| `NODE_ENV` | Controla exposición de `/docs` y `/reference` (deshabilitados en `production`, ver `docs/api/authentication.md`) |
| `RATE_LIMIT_DISABLED` | Usado en pruebas de integración/generación de documentación para desactivar limitación de tasa |
