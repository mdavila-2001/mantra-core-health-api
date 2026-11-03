# mock-provider-server

Emulador **standalone** de los proveedores externos que
`mantra-core-health-redesa-api` no conecta de verdad porque ningún vendor
concreto vive en ese repo:

| Emula | Endpoint | Lo que sustituye en el backend principal |
| --- | --- | --- |
| Gateway de mensajería (SMS/email/push) | `POST /notifications/send` | `NotificationProviderAdapter` en `src/worker/jobs/messaging/notification-delivery.job.ts` |
| Backends destino de borrado cross-store | `POST /deletions/execute`, `POST /deletions/verify` | `DeletionExecutionProviderAdapter`/`DeletionVerificationProviderAdapter` en `src/worker/jobs/cross_store_consistency/deletion-pipeline.job.ts` |
| API de embeddings | `POST /embeddings/compute` | `EmbeddingProviderAdapter` en `src/worker/jobs/vector_rag/embedding-drain.job.ts` |
| Autoridad de verificación de identidad (registro civil / colegio profesional / registro de sociedades) | `POST /identity-verification/execute`, `POST /identity-verification/verify` | `IdentityVerificationProviderAdapter` en `src/worker/jobs/identity_assurance/dispatch-identity-checks.job.ts` |
| Sistema de gestión (ERP) de una farmacia externa: catálogo con códigos propios y stock por sucursal | `GET /pharmacy-erp/products`, `GET /pharmacy-erp/stock?siteCode=` | `HttpExternalPharmacyCatalogAdapter` en `src/modules/pharmacy_inventory/infrastructure/adapters/http-external-pharmacy-catalog.adapter.ts` (la sincronización «Sincronizar ahora» del catálogo de la farmacia) |

### El único proveedor con veredicto diferido

Los otros tres responden en la misma llamada. La verificación de identidad no:
`execute` acepta la solicitud al instante y devuelve un comprobante, y `verify`
responde `PENDING` hasta que pasa `IDENTITY_VERIFICATION_DELAY_MS` (10s por
defecto), momento en el que da `ACCEPTED` o `REJECTED`. Es a propósito — una
autoridad real se comporta así, y es lo único que ejercita de verdad el bucle de
espera del worker. El veredicto se decide **al encolar** y se recuerda, de modo
que dos consultas seguidas nunca se contradicen.

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
| `IDENTITY_VERIFICATION_DELAY_MS` | `10000` | Cuánto tarda la autoridad en dar el veredicto (mientras tanto, `/verify` responde `PENDING`) |
| `IDENTITY_VERIFICATION_REJECTION_RATE` | `0` | Probabilidad (0-1) de que la verificación acabe `REJECTED` |
| `PHARMACY_ERP_FAILURE_RATE` | `0` | Probabilidad (0-1) de que `/pharmacy-erp/*`, `/alovida-standard/*` y `/simulated-chain/*` respondan 503 |
| `PHARMACY_ERP_PHARMACY_KEYS` | (vacío) | Clave de cada farmacia simulada: `CODIGO=clave;OTRO=clave` |
| `PHARMACY_ERP_PHARMACY_KEYS_FILE` | (vacío) | Ruta a un JSON `{ "CODIGO": "clave" }` (semilla; ver `pharmacy-keys.example.json`). La variable anterior pisa a este archivo por código |

## Cómo lo consume el backend principal

`src/worker/worker.env.ts` (backend principal) lee `MOCK_PROVIDER_BASE_URL` /
`MOCK_PROVIDER_API_KEY` con un default que **ya apunta aquí**
(`http://127.0.0.1:4100`, sin API key) — no es opt-in. `MockProviderClient`
(`src/worker/mock-provider-client.service.ts`) es el cliente HTTP; cada
`*WorkerModule` relevante (`messaging`, `cross_store_consistency`,
`vector_rag`, `identity_assurance`) trae un `MockProviderWiringService` (`OnModuleInit`) que
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

La API lee el ERP de farmacia por su propia variable, `PHARMACY_ERP_BASE_URL`
(con `PHARMACY_ERP_API_KEY` y `PHARMACY_ERP_TIMEOUT_MS`), **vacía por
defecto**: sin ella, «Sincronizar ahora» responde que la conexión no está
configurada. Para probarla en local se apunta a este emulador
(`PHARMACY_ERP_BASE_URL=http://127.0.0.1:4100`, con la misma clave que
`MOCK_API_KEY` si se definió). El `siteCode` que pide la API es el código de
su sede (`pharmacy_sites.code`) y el `pharmacyCode`, el de su farmacia
(`pharmacies.code`): el stock sale de los dos, así que dos farmacias con sedes
del mismo código no comparten stock. Con `NODE_ENV=production` la API no
arranca si `PHARMACY_ERP_BASE_URL` trae valor.

## El sistema de una farmacia, como un tercero real

Además de `/pharmacy-erp/*` (la sincronización de un único ERP configurado en el
servidor, que sigue igual), el simulador expone el sistema de **cada farmacia**
en dos formatos, para que la plataforma se conecte con la dirección y la clave
que la farmacia carga en su pestaña Integración:

| | Estándar ALOVIDA | Cadena simulada |
| --- | --- | --- |
| Dirección que se carga | `http://<simulador>:4100/alovida-standard` | `http://<simulador>:4100/simulated-chain/api/v2` |
| Clave | `X-Api-Key: <clave>` | `Authorization: Bearer <clave>` |
| Salud | `GET /v1/pharmacies/{farmacia}/health` | `GET /chains/{cadena}/ping` |
| Catálogo | `GET /v1/pharmacies/{farmacia}/products` → `{ items: [{ code, name, presentation, unitCode }] }` | `GET /chains/{cadena}/catalog?page=&per_page=` → `{ data: [{ sku, description, pack: { label, unit } }], meta }` |
| Stock | `GET /v1/pharmacies/{farmacia}/sites/{sucursal}/stock?codes=` → `{ items: [{ code, quantity }], validUntil }` | `GET /chains/{cadena}/branches/{sucursal}/inventory?page=` → `{ data: [{ sku, on_hand: { units } }], meta }` |
| Precios | `GET /v1/pharmacies/{farmacia}/prices` → `{ currency: "BOB", items: [{ code, unitPrice }] }` | `GET /chains/{cadena}/catalog/prices?page=` → `{ data: [{ sku, price: { amount_cents, currency } }], meta }` |

El Estándar ALOVIDA es el contrato que publica la API
(`docs/integrations/pharmacy-standard.openapi.yaml`). La cadena simulada es
**distinta a propósito**: otra autenticación, otros nombres, datos anidados y
paginación de 5 en 5, para probar el camino de un adaptador antes de tener la
documentación de una cadena real.

- **Clave por farmacia.** Cada código de farmacia (o de cadena) tiene la suya
  (`PHARMACY_ERP_PHARMACY_KEYS` o el archivo de semilla). Una clave equivocada,
  la de otra farmacia o un código sin clave dan **401**. Sin claves
  configuradas, nadie autentica.
- **Stock por ventanas de 5 minutos.** Dentro de una ventana, dos consultas dan
  lo mismo (`validUntil` dice cuándo cierra). Entre ventanas baja según el ritmo
  de venta de cada producto, se repone cada 30 minutos y a veces llega a 0. Es
  determinista por farmacia, sucursal, producto y ventana, sin estado en
  memoria: reiniciar el simulador no cambia lo que responde.
- **Dos farmacias con el mismo código de sucursal no comparten stock**: la
  farmacia entra en el cálculo.
- **Precios** estables por farmacia y producto, en bolivianos.
- `PHARMACY_ERP_FAILURE_RATE` simula que la farmacia no responde (503).

## Tests

```bash
yarn test        # unitarios: notifications, deletions, embeddings, api-key guard, sistema de farmacias
yarn lint
yarn build
```
