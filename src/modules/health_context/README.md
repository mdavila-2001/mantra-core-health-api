# Contexto de salud por país

Este módulo registra contexto sanitario agregado: agentes y fuentes, agendas,
corridas, observaciones, versiones con hechos y evidencia, revisión, publicación
y resolución. No tiene endpoints de paciente. Persiste diez tablas bajo el
esquema `health_context` y el worker `health_context` llama cada 30 segundos a
`POST /health-context/internal/schedules/run-due`.

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

Los servicios usan `NOT_FOUND`, `CONFLICT` y `PRECONDITION_FAILED`, pero aún no
tienen un catálogo propio de `reason` estable. También falta comprobar que una
fuente localizada corresponda al país de la corrida y que su nivel de confianza
sea admisible antes de aceptarla; una corrida con agenda permite hoy valores de
agente o país enviados en el DTO, y un revisor humano puede enviar un
`reviewerAgentId`. La carrera de dos claves de idempotencia iguales recibe el
conflicto del índice en vez de recuperar la corrida ganadora.

El detalle, los planes de corrección y las matrices de cuatro casos están en el
[informe de revisión](../../../docs/revision-backend-2026-10-04/modulos/health_context.md).

## Pruebas

```sh
corepack yarn test src/modules/health_context --runInBand --silent
```

Resultado verificado: **3 suites y 81 pruebas aprobadas**. Las specs son
unitarias; falta integración para roles HTTP, carrera de idempotencia y las
validaciones de procedencia documentadas en el informe.
