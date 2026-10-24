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
| `messaging` | `outbox-relay`, `queue`, `notification-delivery` | `messaging` |
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
- `worker-health.server.ts`: `GET /health`/`liveness`, `/readiness` y `/status` en `WORKER_HEALTH_PORT` (9100 por defecto; 0 deshabilita). La sonda escucha en todas las interfaces por defecto y `/status` no exige autenticación: revisá el [riesgo documentado](../../docs/revision-backend-2026-10-04/workers/worker-framework.md#wf-01--alto-status-entrega-mensajes-de-error-no-saneados-por-una-sonda-abierta) antes de exponer ese puerto.
- `worker.env.ts`: esquema Joi y defaults de URL de API, plazos, salud, reintentos, concurrencia y proveedores. Los esquemas específicos se agregan desde el entrypoint cuando corresponde.

## Pruebas

```bash
corepack yarn test --runInBand --silent src/worker
```

El comando sólo prueba el marco y specs bajo `src/worker`, no ejecuta los 24 jobs de punta a punta. Consultá [la revisión del marco](../../docs/revision-backend-2026-10-04/workers/worker-framework.md) y la [revisión de los 24 jobs](../../docs/revision-backend-2026-10-04/workers/jobs-24.md) para límites, hallazgos y correcciones.
