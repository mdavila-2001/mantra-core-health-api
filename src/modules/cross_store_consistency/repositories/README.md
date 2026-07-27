# Repositorios — cross_store_consistency

Tres repositorios. Ninguno abre transacción: todos reciben el `EntityManager` transaccional del
servicio como primer parámetro.

| Repositorio | Tablas |
| --- | --- |
| `projection.repository.ts` | `projection_definitions`, `projection_subscriptions`, `projection_consumers`, `projection_delivery_attempts`, `projection_checkpoints`, `projection_dead_letters`, `store_consistency_slos` |
| `reconciliation.repository.ts` | `reconciliation_runs`, `reconciliation_items`, `projection_drift_events`, `projection_repair_jobs`, `reindex_jobs` |
| `deletion.repository.ts` | `deletion_requests`, `deletion_targets`, `deletion_executions`, `deletion_verifications`, `cache_invalidation_jobs`, `data_movement_jobs`, `schema_migration_jobs`, `archive_jobs` |

El corte es por las tres cosas que hace el módulo: proyectar, comprobar que la proyección cuadra, y
borrar de todas partes.

## `ReconciliationRuns` viene con alias

El generador nombró la clase `CrossStoreConsistencyReconciliationRuns` —prefijada para no chocar con
la homónima de otro esquema— y el repositorio la importa con alias. Es lo único que se aparta de la
convención de nombres del resto de módulos, y conviene tenerlo presente al añadir métodos.

## Las claves naturales

Casi todo el módulo se apoya en ellas, porque casi todo tiene que ser idempotente:

| Método | Clave | Qué impide |
| --- | --- | --- |
| `findDefinitionByVersion` | `(código, versión)` | duplicar una definición |
| `findSubscription` | `(definición, evento, consumidor)` | dos suscripciones al mismo evento |
| `findAttemptByIdempotencyKey` | `(suscripción, clave)` | aplicar dos veces el mismo evento |
| `findCheckpointForUpdate` | `(suscripción, tenant, partición)` | dos checkpoints de la misma partición |
| `findDeadLetterByAttempt` | `(intento)` | registrar dos veces el mismo fallo |
| `findItem` | `(corrida, entidad)` | comparar dos veces la misma entidad |
| `findOpenDrift` | `(tenant, dataset, entidad, tipo)` mientras esté abierta | veinticuatro incidentes al día del mismo problema |
| `findRepairJobByKey` | clave derivada de `(deriva, acción)` | reparar dos veces |
| `findTarget` | `(solicitud, dataset, backend, localizador)` | objetivos duplicados |
| `findExecutionByKey` | clave derivada de `(objetivo, intento)` | borrar dos veces |
| `findCacheJob` | `(tenant, dataset, entidad, **versión**, ámbito)` | purgas duplicadas por versión |
| `findMovementJob` | `(tenant, dataset, huella del manifiesto)` | mover dos veces el mismo lote |
| `findArchiveJob` | `(tenant, dataset, corte de retención)` | archivar dos veces el mismo corte |

La versión dentro de la clave de `findCacheJob` es la que se olvida con más facilidad: sin ella, la
invalidación de una versión nueva se descartaría por duplicada y la caché seguiría sirviendo dato
viejo.

## Bloqueos

`FOR UPDATE` (`LockMode.PESSIMISTIC_WRITE`):

| Método | Por qué |
| --- | --- |
| `findSloForUpdate` | el upsert lee y escribe la misma fila |
| `findConsumerByCodeForUpdate` | varios hilos del mismo consumidor laten a la vez |
| `findAttemptForUpdate` | mandar a cola muerta y reprocesar tocan el mismo intento |
| `findCheckpointForUpdate` | **dos consumidores de la misma partición no pueden avanzarlo a la vez** |
| `findDeadLetterForUpdate` | dos reprocesos de la misma entrada |
| `findDriftForUpdate` | dos reparaciones de la misma deriva |
| `findRequestForUpdate` · `findTargetForUpdate` | expandir, ejecutar, verificar y cerrar compiten |

## Sin `SKIP LOCKED`

A diferencia de los otros módulos de Tanda B, aquí no hay ninguno. El caso de uso lo sitúa en la
lectura del outbox y en el barrido de objetivos pendientes — dos cosas que hace el worker **antes**
de llamar a estos endpoints. Lo que llega aquí es lo que el worker ya tomó.

## Append-only

`deletion_verifications` sólo tiene `create*`. La verificación es la prueba de ausencia, y poder
editarla la convertiría en una afirmación sin respaldo — que es exactamente lo que un regulador
comprobaría primero.

`reconciliation_items` y `deletion_executions` tampoco se actualizan: son el registro de qué se
comparó y qué se intentó.

## Sin borrados

Ningún repositorio tiene `delete*`. Es coherente con lo que hace el módulo: aquí se registra que algo
se borró **en otro sitio**, y ese registro es justamente lo que no puede desaparecer.

## Los `bigint` como cadena

`sourcePosition`, `canonicalVersion`, `entityVersion`, `archivedCount`, `deletedHotCount`,
`processedCount`, `failedCount` y `migratedCount` viajan como `string`. El servicio de entrega compara
`sourcePosition` con `BigInt`: por encima de 2^53 un `number` pierde precisión, y ahí es donde un
checkpoint empezaría a retroceder sin que nadie lo note.
