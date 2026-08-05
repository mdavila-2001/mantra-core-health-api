# Repositorios de contexto de salud

Acceso a datos de `health_context.*`. Sin lógica de negocio: sólo lecturas, escrituras y el modo de
bloqueo que cada operación necesita.

## Repositorio

Uno solo, `HealthContextRepository`, sobre las diez tablas del módulo. Recolección y publicación son
dos mitades, pero están cosidas: la versión referencia la corrida, y la evidencia de cada hecho
apunta a una observación de esa corrida. Partirlo obligaría a la mitad publicadora a leer tablas de
la recolectora.

## Lecturas con bloqueo

| Método | Modo | Por qué |
| --- | --- | --- |
| `findScheduleForUpdate` | `FOR UPDATE` | Arrancar la corrida adelanta `next_run_at`; el cierre sella `last_success_at` |
| `findRunForUpdate` | `FOR UPDATE` | Los contadores suben al vuelo y se concilian al cerrar |
| `findContextForUpdate` | `FOR UPDATE` | El número de versión sale de un máximo; y mueve `current_version_id` |
| `findVersionForUpdate` | `FOR UPDATE` | Revisar, publicar o retirar cambian su estado y su vigencia |
| `findPublishedVersionForUpdate` | `FOR UPDATE` | Publicar y supersedir deben ver la misma vigente |

El resto son lecturas simples: catálogo, comprobación de duplicados y resolución para consumo, que no
debe bloquear a quien publica.

## Consultas que llevan semántica

- **`findContextByKey(country, domain, key)`** es la clave natural del contexto. Sirve a la vez para
  detectar el duplicado en UC-44-04 y para resolver en UC-44-12.
- **`findPublishedVersionForUpdate`** filtra por `effective_to IS NULL`: la invariante de "una sola
  publicada" vive en la consulta, no en memoria.
- **`findRunByIdempotencyKey`** es la clave de idempotencia del scheduler.
- **`findObservationByHash(runId, hash)`** deduplica dentro de la corrida, no globalmente: el mismo
  documento en dos recolecciones distintas es legítimamente dos observaciones.
- **`findObservationsByRun`** alimenta dos cosas: la conciliación de contadores al cerrar (UC-44-10)
  y el conjunto de observaciones aceptadas contra el que se valida la evidencia (UC-44-07).
- **`findEvidenceByFacts(ids)`** trae los enlaces de varios hechos de una vez; resolver el contexto
  hecho a hecho multiplicaría las consultas por el número de hechos.

## Inmutables

`createObservation`, `createFact`, `createFactEvidence` y `createQualityReview` sólo insertan: no hay
método para modificarlos ni eliminarlos. La observación es lo que se recogió, el hecho es lo que se
publicó y la evidencia es el enlace entre ambos; los tres dejarían de servir para lo que existen si
se pudieran reescribir. Tampoco llevan `createdBy`: sólo `recorded_at`/`recorded_by_user_id`.

Lo mismo vale para `context_collection_runs`: se inserta al arrancar y sólo se cierra una vez.

## Auditoría

Las tablas con columnas de auditoría —agentes, fuentes, programaciones y contextos— pasan por
`createdBy(actorUserId)` al crearse y por `touch(entity, actorUserId)` al modificarse desde el
servicio.

## Pruebas

El repositorio no tiene suite propia; se ejercita como doble desde
`context-collection.service.spec.ts` y `country-context.service.spec.ts`.
