# Contexto de salud por país

Este módulo registra contexto sanitario agregado: agentes y fuentes, agendas,
corridas, observaciones, versiones con hechos y evidencia, revisión, publicación
y resolución. No tiene endpoints de paciente. Persiste diez tablas bajo el
esquema `health_context` y el worker `health_context` llama cada 30 segundos a
`POST /health-context/internal/schedules/run-due`.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/health_context -name '*.controller.ts' | wc -l
  find src/modules/health_context -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/health_context -name '*.entity.ts' | wc -l
  find src/modules/health_context -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 13 rutas HTTP, 10 entidades y 2 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 10 de 10 archivos `*.entity.ts`): `context_agents`, `context_collection_runs`, `context_fact_evidence`, `context_quality_reviews`, `context_source_observations`, `country_context_schedules`, `country_health_context_versions`, `country_health_contexts`, `health_context_facts`, `health_context_sources`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /health-context/agents` | SOURCE_ADMIN, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/sources` | SOURCE_ADMIN, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/schedules` | CONTEXT_CURATOR, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/internal/schedules/run-due` | SYSTEM | `health-context` |
| `POST /health-context/contexts` | CONTEXT_CURATOR, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/collection-runs` | SYSTEM, CONTEXT_CURATOR, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/collection-runs/:id/observations` | SYSTEM, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/contexts/:id/versions` | SYSTEM, CONTEXT_CURATOR, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/versions/:id/quality-reviews` | QUALITY_REVIEWER, SYSTEM, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/versions/:id/publish` | CONTEXT_CURATOR, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/collection-runs/:id/finish` | SYSTEM, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/versions/:id/supersede` | CONTEXT_CURATOR, PLATFORM_ADMIN | `health-context` |
| `GET /health-context/contexts/resolve` | CONTEXT_CONSUMER, CONTEXT_CURATOR, SYSTEM, PLATFORM_ADMIN | `health-context` |


## Casos de uso cubiertos (12)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/health_context -name '*.controller.ts' | wc -l
  find src/modules/health_context -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/health_context -name '*.entity.ts' | wc -l
  find src/modules/health_context -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 13 rutas HTTP, 10 entidades y 2 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 10 de 10 archivos `*.entity.ts`): `context_agents`, `context_collection_runs`, `context_fact_evidence`, `context_quality_reviews`, `context_source_observations`, `country_context_schedules`, `country_health_context_versions`, `country_health_contexts`, `health_context_facts`, `health_context_sources`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /health-context/agents` | SOURCE_ADMIN, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/sources` | SOURCE_ADMIN, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/schedules` | CONTEXT_CURATOR, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/internal/schedules/run-due` | SYSTEM | `health-context` |
| `POST /health-context/contexts` | CONTEXT_CURATOR, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/collection-runs` | SYSTEM, CONTEXT_CURATOR, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/collection-runs/:id/observations` | SYSTEM, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/contexts/:id/versions` | SYSTEM, CONTEXT_CURATOR, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/versions/:id/quality-reviews` | QUALITY_REVIEWER, SYSTEM, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/versions/:id/publish` | CONTEXT_CURATOR, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/collection-runs/:id/finish` | SYSTEM, PLATFORM_ADMIN | `health-context` |
| `POST /health-context/versions/:id/supersede` | CONTEXT_CURATOR, PLATFORM_ADMIN | `health-context` |
| `GET /health-context/contexts/resolve` | CONTEXT_CONSUMER, CONTEXT_CURATOR, SYSTEM, PLATFORM_ADMIN | `health-context` |

## API y permisos

| Método y ruta | Roles | DTO / resultado |
| --- | --- | --- |
| `POST /agents`, `/sources` | `SOURCE_ADMIN`, `PLATFORM_ADMIN` | `CreateAgentDto` / `CreateSourceDto`; alta por código. |
| `POST /schedules` | `CONTEXT_CURATOR`, `PLATFORM_ADMIN` | `CreateScheduleDto`; agenda un agente activo. |
| `POST /internal/schedules/run-due` | `SYSTEM` | `RunDueSchedulesDto`; reclama agendas vencidas. |
| `POST /contexts` | `CONTEXT_CURATOR`, `PLATFORM_ADMIN` | `CreateContextDto`; crea raíz en borrador. |
| `POST /collection-runs` | `SYSTEM`, `CONTEXT_CURATOR`, `PLATFORM_ADMIN` | `StartCollectionRunDto`; inicia o repite una corrida por clave. |
| `POST /collection-runs/:id/observations`, `/finish` | `SYSTEM`, `PLATFORM_ADMIN` | Observa o cierra una corrida. |
| `POST /contexts/:id/versions` | `SYSTEM`, `CONTEXT_CURATOR`, `PLATFORM_ADMIN` | `DraftContextVersionDto`; crea hechos y enlaces a evidencia. |
| `POST /versions/:id/quality-reviews` | `QUALITY_REVIEWER`, `SYSTEM`, `PLATFORM_ADMIN` | `RecordQualityReviewDto`; cambia borrador a aprobado o rechazado. |
| `POST /versions/:id/publish`, `/supersede` | `CONTEXT_CURATOR`, `PLATFORM_ADMIN` | Publica o retira una versión. |
| `GET /contexts/resolve` | `CONTEXT_CONSUMER`, curador, sistema o plataforma | Devuelve versión publicada, hechos y UUIDs de evidencia. |

Todas las rutas usan JWT y las rutas con identificador usan `ParseUUIDPipe`.
La tubería global rechaza propiedades ajenas al DTO y el cuerpo HTTP está
limitado a 1 MB.

## Reglas implementadas

- La corrida bloquea la programación cuando la usa; observación y cierre
  bloquean la corrida. Las versiones, publicación y retiro bloquean contexto o
  versión según la transición.
- Una observación se deduplica por `(collectionRunId, contentHash)` en la capa
  de servicio; cerrar una corrida reconcilia los contadores contra sus
  observaciones.
- Una versión exige una corrida del mismo país y hechos con evidencia de
  observaciones aceptadas de esa corrida. Sólo una versión aprobada se puede
  publicar y la anterior queda retirada en la misma transacción.
- `resolve` devuelve una versión publicada vencida con `stale: true`.

## Datos y dependencias

Las entidades principales son `context_agents`, `health_context_sources`,
`country_context_schedules`, `context_collection_runs`,
`context_source_observations`, `country_health_contexts`,
`country_health_context_versions`, `health_context_facts`,
`context_fact_evidence` y `context_quality_reviews`. Depende de MikroORM,
`HealthContextRepository`, `PinoLogger`, conceptos de terminología y del
cliente interno del worker.

## Errores y límites conocidos

Los servicios usan `NOT_FOUND`, `CONFLICT` y `PRECONDITION_FAILED`; los casos
de procedencia llevan `reason` estable (`health_context.error-reasons.ts`):

- `HEALTH_CONTEXT_SOURCE_NOT_ELIGIBLE` (422): una observación de una fuente
  localizada en otro país que la corrida se rechaza siempre; aceptar exige una
  fuente con nivel de confianza declarado. Sin país la fuente es global. No se
  revela país ni fuente. Qué niveles de confianza bastan para aceptar es una
  decisión de catálogo que el modelo aún no expresa.
- `HEALTH_CONTEXT_SCHEDULE_BINDING_MISMATCH` (422): una corrida con
  `scheduleId` toma agente y país de la programación bloqueada; un valor del
  DTO que la contradice se rechaza antes de tocar `next_run_at`.
- `HEALTH_CONTEXT_IDEMPOTENCY_RESOLUTION_FAILED` (409): ante la carrera de dos
  claves de idempotencia iguales, quien pierde el índice único relee la corrida
  ganadora y recibe `duplicate: true`; si el único violado es otro o la ganadora
  no se recupera, responde este conflicto. Las altas de agente, fuente y
  contexto que pierden su único responden el mismo conflicto de negocio que su
  chequeo previo. El contexto (país, dominio, clave) no tiene índice único en
  el DDL: la carrera sólo se cierra allí cuando el modelo lo declare.

A un revisor humano todavía se le permite enviar un `reviewerAgentId`.

## Pruebas

```sh
corepack yarn test src/modules/health_context --runInBand --silent
```

Las specs son unitarias; no cubren roles HTTP ni una carrera real entre dos
transacciones (se simula la pérdida del índice único).
