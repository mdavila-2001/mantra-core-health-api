# Operations console module

Esta carpeta contiene las consultas de la consola global de operaciones:
readiness, incidentes, despliegues, cambios, SLO, respaldos, tráfico HTTP, el
catálogo de herramientas e integraciones con su estado y la sonda de vida de
instancias. Sus rutas de lectura están reservadas a roles operativos de
plataforma; la única escritura es la ingesta de latidos de los workers, sólo
para el rol `SYSTEM`.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-31 sobre claude/admin-sonda-herramientas-dev (e1805fa8). Repetir con:
  find src/modules/ops_console -name '*.controller.ts' | wc -l
  find src/modules/ops_console -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/ops_console -name '*.entity.ts' | wc -l
  find src/modules/ops_console -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **4 controllers, 12 rutas HTTP, 0 entidades y 4 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` importa `RouteIndexModule` (el índice de rutas en proceso, para resolver `operationId`) y `DocumentStoreModule`, `RedisRuntimeModule` y `SearchPlatformModule`, porque construye su propia instancia de `AppReadinessService` (la de `AppModule` no se exporta) para las sondas en vivo de `/admin/ops/tools` y de `/admin/ops/instances/liveness`; de
`RedisRuntimeModule` toma además `REDIS_CLIENT` para el hash de latidos.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `GET /admin/ops/readiness` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/incidents` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/incidents/:id` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/deployments` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/change-requests` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/slos` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/backups` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/traffic` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/traffic/endpoints` | ...OPS_READ_ROLES | `ops-console` |
| `GET /admin/ops/tools` | ...OPS_READ_ROLES | `ops-tools` |
| `GET /admin/ops/instances/liveness` | ...OPS_READ_ROLES | `ops-liveness` |
| `POST /internal/ops/heartbeats` | SYSTEM | `ops-heartbeat` |

## Tráfico HTTP (`/admin/ops/traffic*`)

Lee `time_series.service_sli_series` (`sli_code = 'http_requests'`), que escribe
`src/observability/http-sli` cuando `OBSERVABILITY_HTTP_SLI_ENABLED=true`, y
`iam.sessions` para los usuarios activos. Sólo `SELECT`, siempre agregado:

- Cada fila de la serie es **un minuto de una (método, plantilla de ruta)**, y
  `service_sli_series` no tiene clave única: la lectura **suma**, nunca lee por fila.
- La respuesta nunca trae una dirección real, un usuario ni un identificador:
  `route` es la plantilla (`/patients/:id`), `UNMATCHED` agrupa lo que no coincidió
  con ninguna ruta y `__overflow__` lo que superó el tope de cardinalidad por minuto.
- La latencia sale de un histograma acumulado de 11 cortes (5 ms – 10 s): `p50`/`p95`
  son **estimaciones** (`method: 'histogram-estimate'`) y `approximate: true` indica
  que cayeron en el último corte, o sea «por lo menos esto».
- «Hoy» es 00:00 UTC del día de `to` salvo que se pida `from`; la ventana, con su
  `timezone: 'UTC'`, viaja en la respuesta. Una ventana inválida es `422 VALIDATION_FAILED`
  con la razón (misma convención que `/admin/analytics`).
- «Usuarios activos» son sesiones de IAM, no usuarios que hicieron peticiones: la
  medición no guarda quién hizo cada una. `activeUsers.definition` lo dice.
- `notMeasured` enumera lo que la medición no cubre; con la medición apagada, su
  única entrada es `disabled`.

## Herramientas e integraciones (`/admin/ops/tools`)

Catálogo cerrado **en código** (`domain/tool-catalog.ts`): 19 herramientas, cada
una con el archivo del que sale (env schema o cliente), `kind`, `provider`,
`purpose`, `isCritical`, `status`, `requiredEnvVars` (sólo nombres),
`checkType`, `failureImpact` y `fallback`. No lee `platform_ops.tool_registry`
ni ninguna otra tabla. `OpsToolsService` añade por herramienta:

- `binding` (`real` | `mock` | `none` | `simulated`): la misma condición con la
  que el módulo dueño elige su adaptador (`FILE_STORAGE_ADAPTER`, las cuatro
  credenciales de Gmail, `MOCK_PROVIDER_BASE_URL` fuera de producción,
  `SIAT_MODE`, `PAYMENTS_VIA_GATEWAY`, `AUDIO_TTS_PROVIDER`…).
- `isConfigured` y `missingEnvVars`: nombres de las variables requeridas y
  vacías. Un interruptor apagado no «falta»: deja `binding` en `none` o
  `simulated` con `missingEnvVars: []`. Ningún valor de entorno sale en la
  respuesta.
- `checkType`: `LIVE` sólo para PostgreSQL, MongoDB, Redis y OpenSearch, con las
  sondas de `GET /readiness` (`AppReadinessService`, plazo de 3 s) y una caché
  en memoria de 10 s compartida por todas las peticiones; `CONFIGURATION` para
  los proveedores sin sonda barata; `NOT_APPLICABLE` para las capacidades que
  hoy sólo tienen adaptador `mock` o `none` (verificación de identidad,
  embeddings, borrado entre almacenes).
- `isHealthy`: `true`/`false` sólo con `LIVE`; `CONFIGURATION` y
  `NOT_APPLICABLE` devuelven `null` y nunca se informan como caídas. Una sonda
  `up` por encima de 1000 ms sigue sana y el `healthMessage` lo dice. Si la
  sonda no pudo ejecutarse, las cuatro quedan en `null`, no en rojo.
- `healthMessage` es texto propio; el error del driver queda en el log de
  `AppReadinessService`, no en la respuesta.

La respuesta es `{ modelVersion: 'ops-tools/v1', evaluatedAt, summary: { total,
healthy, down, noProbe, notApplicable, critical }, tools: [...] }`, completa y
sin paginar; el front deriva el estado vivo sólo de `isHealthy`.

## Sonda de vida de instancias (`/admin/ops/instances/liveness`)

Un estado `VIVA` sólo se emite con evidencia fresca y verificable, calculada con
el reloj de la API; todo lo demás degrada, nunca se rellena. El cliente no
calcula estados: pinta lo que el servidor declara.

- **Workers (25).** Cada proceso `src/worker-<dominio>.ts` emite un latido cada
  `WORKER_HEARTBEAT_INTERVAL_MS` (15 s) a `POST /internal/ops/heartbeats` con el
  `SystemApiClient` que ya usan sus jobs (`src/worker/worker-heartbeat.service.ts`).
  La API guarda el cuerpo en Redis (`HSET ops:heartbeat:v1 <instanceId>`, TTL de
  7 días sobre el hash entero) añadiendo `receivedAt` de su propio reloj; `sentAt`
  del worker no decide nada. Un `instanceId` fuera del registro cerrado
  (`domain/instance-registry.ts`) es `422` con `reason: INSTANCE_UNKNOWN` y no se
  guarda. La ruta está excluida de la medición HTTP y no audita.
- **Regla de decisión** (`domain/instance-liveness.ts`, función pura, con
  `age = evaluatedAt − receivedAt` en ms): Redis sin responder →
  `SIN_DATO / STORE_UNAVAILABLE`; sin fila → `SIN_DATO / NEVER_SEEN`; fila
  ilegible → `SIN_DATO / RECORD_CORRUPT`; latido más de 5 s en el futuro →
  `SIN_DATO / CLOCK_INCONSISTENT`; `age > OPS_LIVENESS_DOWN_AFTER_SECONDS` (60) →
  `CAIDA / HEARTBEAT_EXPIRED`; `age > OPS_LIVENESS_DEGRADED_AFTER_SECONDS` (30) →
  `DEGRADADA / HEARTBEAT_LATE`; fresco pero `starting|draining|stopped` →
  `DEGRADADA / DRAINING`; liveness enferma → `DEGRADADA / TICK_STUCK`; readiness
  enferma → `DEGRADADA / CIRCUIT_OPEN`; si no, `VIVA / OK`. Los umbrales se
  validan al arrancar (`down > degraded ≥ intervalo`, enteros) y viajan en
  `thresholds`.
- **Bases y servicios.** `postgresql`, `mongodb`, `redis` y `opensearch` se
  sondan en la petición con el mismo código y plazo de `GET /readiness`
  (`AppReadinessService.collect()`, 3 s), cacheado 10 s: `up` ≤ 1000 ms → `VIVA`,
  más lento → `DEGRADADA / PROBE_SLOW`, `down` → `CAIDA / PROBE_TIMEOUT` o
  `PROBE_FAILED` (sólo la clase del error, nunca el mensaje). `minio`, `clamav` y
  `mock-provider-server` no se sondan: `SIN_DATO / NOT_PROBED`, `required:false`.
  Con Redis caído, `heartbeatStore.status='down'`, `redis` aparece `CAIDA` y los
  workers `SIN_DATO`; la respuesta sigue siendo `200`.
- **API.** `VIVA / OK` con `evidence.source='self'`: sólo prueba la instancia que
  respondió. Las réplicas están en `notMeasured`.
- **`overall`** sobre las instancias `required`: `CRITICO` si alguna está `CAIDA`;
  `SIN_DATO` si ninguna es evaluable; `ATENCION` si alguna está `DEGRADADA` o
  `SIN_DATO`; `OK` sólo si todas están `VIVA`. `OPS_LIVENESS_REQUIRED_WORKERS`
  (CSV) acota qué workers pesan; por defecto todos salvo `worker-files`, que corre
  bajo un perfil opt-in de Compose.

La respuesta es `{ modelVersion: 'instance-liveness/v1', evaluatedAt, overall,
summary: { VIVA, DEGRADADA, CAIDA, SIN_DATO, total }, heartbeatStore: { status,
reason }, thresholds, instances: [{ id, label, type, required, state,
lastHeartbeatAt, ageSeconds, thresholdSeconds, cause, causeDetail, evidence:
{ source, reportedStatus, startedAt, latencyMs } }], notMeasured }`. No expone
`pid`, mensajes de error, hosts ni cadenas de conexión.

## Verificación

```bash
corepack yarn test src/modules/ops_console --runInBand --silent

# contra una base descartable con el DDL de database/SQL aplicado
OPS_TRAFFIC_IT_DB_URL=postgres://… corepack yarn test:integration test/integration/ops-traffic.int-spec.ts
```
