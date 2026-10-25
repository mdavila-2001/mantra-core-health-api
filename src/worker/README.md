# Workers de ALOVIDA

La API (`src/main.ts`) y los workers son procesos separados. Cada archivo `src/worker-<dominio>.ts` inicia un módulo de `src/worker/jobs/<dominio>/` mediante `bootstrapWorker`. El arranque común valida variables de entorno, configura telemetría, cliente HTTP a la API, scheduler, control de ticks, drenaje de SIGTERM y sonda HTTP. El código de cada job determina su cadencia, lote, idempotencia y dependencias; este marco no proporciona un lock distribuido único para todos.

## Mapa de 24 procesos

| Worker / entrypoint `src/worker-*.ts` | Jobs programados observados en `src/worker/jobs/` | Script `start:worker:*` |
|---|---|---|
| `audio-assets` | `audio-generation` | `audio-assets` |
| `automation` | `calendar-trigger` | `automation` |
| `billing` | `run-due-dunning` | `billing` |
| `community` | `feed-fanout`, `search-indexer`, `badge-expiry` | `community` |
| `consent` | `expiration-sweep` | `consent` |
| `cross_store_consistency` | `deletion-pipeline` | `cross_store_consistency` |
| `data_catalog` | `scan-tick` | `data_catalog` |
| `delegated_access` | `expiry-sweep` | `delegated_access` |
| `files` | `malware-scan`, `storage-lifecycle` | Sin script; Compose usa Node directo |
| `health_context` | `schedule-tick` | `health_context` |
| `identity_assurance` | `dispatch-identity-checks`, `expire-sweep`, `evidence-lifecycle` | `identity_assurance` |
| `integrations` | `message-retry`, `message-correlation`, `message-dispatch` | `integrations` |
| `lakehouse` | `release-expiry` | Sin script; Compose usa Node directo |
| `messaging` | `outbox-relay`, `queue`, `notification-delivery`, `prescription-expiry-notice` | `messaging` |
| `pharmacy_inventory` | `expire-reservations` | `pharmacy_inventory` |
| `promotions` | `expire-points` | `promotions` |
| `qa_lab` | `schedule-tick`, `plan-run-tick` | `qa_lab` |
| `read_models` | `read-model-reconciliation` | `read_models` |
| `reporting` | `scheduler-tick` | `reporting` |
| `scheduling` | `dispatch-reminders`, `promote-waitlist`, `expire-holds` | `scheduling` |
| `time_series` | `apply-retention`, `refresh-rollups`, `compress-chunks` | Sin script; Compose usa Node directo |
| `tracking` | `sla-scan` | `tracking` |
| `vector_rag` | `embedding-drain` | Sin script; Compose usa Node directo |
| `workflow` | `sweep-timeouts` | `workflow` |

El mapa refleja archivos y scripts de esta rama; no significa que los 24 procesos estén activos en cada despliegue. `docker-compose.yml` declara los 24 (algunos bajo perfiles), mientras `docker-compose.coolify.yml` declara explícitamente sólo `messaging`, `scheduling`, `workflow` y `read_models`.

## Contratos comunes

- `run-tick.util.ts`: evita que se solape el mismo tick en un proceso, limita su duración y registra su resultado. El job debe diseñar idempotencia y exclusión entre réplicas según su recurso.
- `system-api-client.service.ts`: obtiene token `SYSTEM` para la API; `GET` se puede reintentar, `POST` sólo cuando el job declara `idempotent: true`.
- `worker-lifecycle.service.ts`: al apagar, deja de admitir ticks raíz y espera los existentes hasta `WORKER_DRAIN_TIMEOUT_MS`.
- `worker-health.server.ts`: `GET /health`/`liveness`, `/readiness` y `/status` en `WORKER_HEALTH_PORT` (9100 por defecto; 0 deshabilita). La sonda escucha por defecto sólo en `127.0.0.1` (`WORKER_HEALTH_HOST` la abre de forma explícita), `/status` no exige autenticación y por eso expone únicamente códigos estables de fallo (`lastErrorCode`: `TICK_FAILED`/`TICK_TIMEOUT`), nunca el mensaje de la excepción: el detalle va al log del worker.
- `provider-capability.ts`: los workers cuya capacidad depende de un proveedor externo (`cross_store_consistency`, `identity_assurance`, `vector_rag`) declaran con qué se atiende (`none` = adapter por defecto, `mock` = emulador, `real`). En producción sólo `real` cuenta: lo demás deja `/readiness` en 503 con el motivo y registra un error al arrancar. No aborta el arranque (evita el bucle de reinicios); `/health` no cambia. Hoy ningún adapter productivo existe en el repo, así que estos tres workers aparecen no listos en producción hasta que se conecte uno. Sin `MOCK_PROVIDER_BASE_URL`, producción no cae al emulador local.
- `time_series` (compresión, retención, refresco de rollups): operan sobre tablas compartidas, así que sus métricas y eventos de outbox se atribuyen al sujeto de plataforma `TS_ADMIN_TENANT_ID` (UUID; por defecto el tenant `DEFAULT` del seed), no a un tenant escondido en el job. Un valor que no es UUID aborta el arranque.
- `worker.env.ts`: esquema Joi y defaults de URL de API, plazos, salud, reintentos, concurrencia y proveedores. Los esquemas específicos se agregan desde el entrypoint cuando corresponde.

## Pruebas

```bash
corepack yarn test --runInBand --silent src/worker
```

El comando sólo prueba el marco y specs bajo `src/worker`, no ejecuta los 24 jobs de punta a punta.
