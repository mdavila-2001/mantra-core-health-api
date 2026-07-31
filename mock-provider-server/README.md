# mock-provider-server

Emulador **standalone** de los tres proveedores externos que
`mantra-core-health-redesa-api` todavía no conecta de verdad porque ningún
vendor concreto vive en ese repo (ver `ESTADO-Y-PENDIENTES.md` del backend
principal, sección "Conectar proveedores externos reales a los workers"):

| Emula | Endpoint | Lo que sustituye en el backend principal |
| --- | --- | --- |
| Gateway de mensajería (SMS/email/push) | `POST /notifications/send` | `NotificationProviderAdapter` en `src/worker/jobs/messaging/notification-delivery.job.ts` |
| Backends destino de borrado cross-store | `POST /deletions/execute`, `POST /deletions/verify` | `DeletionExecutionProviderAdapter`/`DeletionVerificationProviderAdapter` en `src/worker/jobs/cross_store_consistency/deletion-pipeline.job.ts` |
| API de embeddings | `POST /embeddings/compute` | `EmbeddingProviderAdapter` en `src/worker/jobs/vector_rag/embedding-drain.job.ts` |

## Por qué es un proyecto aparte

Es un NestJS **completamente independiente**: su propio `package.json`,
`node_modules`, `tsconfig`, tests y `Dockerfile`. No importa nada del backend
principal ni comparte base de datos, esquema multi-tenant o el esquema de
auth interno (JWT `SYSTEM`) — un proveedor real tampoco los tendría. Así se
puede levantar solo, en cualquier máquina, sin arrastrar Postgres/Mongo/Redis/
OpenSearch/MinIO del stack principal.

## No es un mock de verificación de comportamiento — es un doble de prueba

No hay nada "de verdad" detrás: `/deletions/execute` no borra nada en ningún
Mongo/OpenSearch real, `/embeddings/compute` no calcula significado semántico
(el vector es determinista, derivado de un hash del texto — el mismo texto
siempre da el mismo vector, útil para probar deduplicación), y
`/notifications/send` no entrega ningún SMS/email. Lo que sí hace, igual que
un proveedor real:

- responde con la misma forma que la API real esperaría (ids, receipts,
  vectores, códigos de error);
- puede fallar (`NOTIFICATIONS_FAILURE_RATE`/`DELETIONS_FAILURE_RATE`
  configurables) para ejercitar el camino de reintento/backoff del worker;
- tiene latencia simulada (`SIMULATED_LATENCY_MS`) en vez de responder en 0ms;
- exige autenticación por API key (`X-Api-Key`), como cualquier vendor real —
  no el JWT interno del backend principal.

## Levantarlo

```bash
cd mock-provider-server
cp .env.example .env   # opcional, los defaults ya sirven
yarn install
yarn start:dev
```

Documentación interactiva (Swagger) en `http://localhost:4100/docs`. Health
check sin auth en `GET /health`.

### Con Docker

```bash
cd mock-provider-server
docker build -t mantra-redesa-mock-provider-server:local .
docker run -p 4100:4100 mantra-redesa-mock-provider-server:local
```

### Junto al resto del stack (docker-compose del backend principal)

El `docker-compose.yml` del backend principal ya lo declara como servicio
(`mock-provider-server`) y por defecto `MOCK_PROVIDER_BASE_URL` de la API y
los workers apunta a `http://mock-provider-server:4100` — no hace falta tocar
nada para que `worker-messaging`, `worker-cross_store_consistency` y
`worker-vector_rag` lo usen en cuanto el stack completo (`docker compose up`)
esté arriba.

## Configuración (`.env`)

| Variable | Default | Qué hace |
| --- | --- | --- |
| `PORT` | `4100` | Puerto de escucha |
| `MOCK_API_KEY` | (vacío) | Si se define, `X-Api-Key` pasa a ser obligatoria |
| `NOTIFICATIONS_FAILURE_RATE` | `0.1` | Probabilidad (0-1) de que `/notifications/send` falle |
| `DELETIONS_FAILURE_RATE` | `0.05` | Probabilidad (0-1) de que `/deletions/execute` falle |
| `SIMULATED_LATENCY_MS` | `50` | Latencia añadida a cada respuesta |

## Cómo lo consume el backend principal

`src/worker/worker.env.ts` (backend principal) lee `MOCK_PROVIDER_BASE_URL` /
`MOCK_PROVIDER_API_KEY` con un default que **ya apunta aquí**
(`http://127.0.0.1:4100`, sin API key) — no es opt-in. `MockProviderClient`
(`src/worker/mock-provider-client.service.ts`) es el cliente HTTP; cada
`*WorkerModule` relevante (`messaging`, `cross_store_consistency`,
`vector_rag`) trae un `MockProviderWiringService` (`OnModuleInit`) que
sustituye el adapter por defecto del job — el que falla con
`PROVIDER_NOT_CONFIGURED` — por uno que llama a este emulador, sólo si
`MockProviderClient.isConfigured()` es verdadero. Para volver al
comportamiento "falla visible" (p. ej. en un entorno donde ya hay un
proveedor real conectado), basta con dejar `MOCK_PROVIDER_BASE_URL` vacía.

## Límite honesto del adapter de embeddings

`EmbeddingPipelineService` (backend principal) no calcula embeddings, los
recibe ya calculados del worker — pero de dónde saca el worker el TEXTO
fuente a embeber es una integración que no existe todavía en ese repo (no hay
document_store→vector_rag wiring). El adapter de embeddings de este
emulador (`src/worker/jobs/vector_rag/mock-embedding-provider.adapter.ts` en
el backend principal) arma un único documento **sintético** por job (texto de
prueba, no contenido real) sólo para probar que el cableado de punta a punta
funciona: descubrir el job → pedir el vector aquí → persistirlo. No indexa
nada real.

## Tests

```bash
yarn test        # unitarios (16 casos: notifications, deletions, embeddings, api-key guard)
yarn lint
yarn build
```
