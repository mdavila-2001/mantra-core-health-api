# Servicios — cross_store_consistency

Cuatro servicios. Cada método público es un caso de uso completo dentro de un único
`em.transactional`.

| Servicio | UC | Qué hace |
| --- | --- | --- |
| `projection-delivery.service.ts` | 01, 02, 03, 04 | proyecta y lleva el checkpoint |
| `reconciliation.service.ts` | 05, 06, 07 | comprueba que la proyección cuadra y la repara |
| `deletion.service.ts` | 08, 09, 10, 11 | borra de todas partes y lo verifica |
| `storage-maintenance.service.ts` | 12, 13, 14 | caché, movimiento y archivado |

## ProjectionDeliveryService

- `registerProjection` (UC-62-01) — definición, suscripciones y SLO en una transacción. Una
  definición sin suscripciones no proyecta nada, y sin SLO nadie sabría cuándo comprobar que
  funciona. Rechaza proyectar un dataset sobre sí mismo.
- `processDelivery` (UC-62-02 + UC-62-03) — el método central. El orden no es negociable:

  1. clave de idempotencia derivada de `(evento, hash del payload)`;
  2. si ya hay un intento `SUCCEEDED` con esa clave → `duplicate`, no se toca nada;
  3. se registra el intento;
  4. **sólo si la escritura está confirmada durable**, `advanceCheckpoint`.

  `advanceCheckpoint` compara con `BigInt` y no retrocede. Un evento que llega tarde se aplica —el
  destino es idempotente— pero no mueve la posición hacia atrás: eso haría releer todo lo procesado.

  `touchConsumer` registra el latido. Sin él no habría forma de distinguir "no llegan eventos" de "el
  consumidor está caído".

- `sendToDeadLetter` (UC-62-04) — el payload se preserva en el almacén de objetos, no aquí: es lo que
  permite reprocesarlo sin haber guardado el cuerpo del evento en una tabla de control.
- `replayDeadLetter` (UC-62-04) — **conserva la clave del intento original**. Si el destino llegó a
  aplicar la escritura antes de fallar en otra parte, el reproceso no la duplica.

## ReconciliationService

- `runReconciliation` (UC-62-05 + UC-62-06) — los dos casos de uso son una sola operación porque el
  segundo se declara *interno, parte del primero*: detectar una divergencia y no registrarla en la
  misma transacción dejaría una comparación cuyo resultado nadie recoge.

  `MATCH` se cuenta; `DIVERGENT`, `MISSING` y `EXTRA` abren deriva salvo que ya haya una viva del
  mismo tipo sobre la misma entidad. La severidad sale de `DRIFT_SEVERITY`: `EXTRA` es `CRITICAL`
  porque un huérfano puede ser un borrado que no se propagó.

- `repairDrift` (UC-62-07) — la reparación **recomputa desde el canónico**; por eso la acción
  natural es `REPROJECT`. `DELETE_ORPHAN` es la única que borra y sólo vale sobre una deriva `EXTRA`.

  La deriva se cierra **al encolar**, no al terminar la reparación. Si la reparación falla, la
  siguiente reconciliación volverá a detectarla y abrirá una nueva; dejarla abierta bloquearía esa
  detección por la deduplicación.

## DeletionService

Lo estructura la regla del modelo `cross_store_deletion_verification_required`: un borrado no está
completo porque se haya ejecutado, sino porque se ha comprobado que el dato ya no está.

- `requestDeletion` (UC-62-08) — una sola solicitud viva por sujeto; el `due_at` se fija al crearla
  porque gobierna el plazo legal.
- `expandDeletion` (UC-62-09) — un objetivo con retención legal **se registra igualmente** y nace
  `BLOCKED`. Dejarlo fuera de la lista haría creer que no existe.
- `executeDeletion` (UC-62-10) — un objetivo con retención legal **no se toca**, y saltárselo en
  silencio sería borrar algo que la ley obliga a conservar. El `provider_receipt` es la evidencia.
- `verifyDeletion` (UC-62-11) — `VERIFIED` sólo con ausencia confirmada **y** cero residuos. Con
  residuos vuelve a `PENDING` para que se reintente.
- `closeDeletionRequest` (UC-62-11) — cierra sólo si todo objetivo está verificado o bloqueado. Y
  distingue el desenlace: si no hay ni uno verificado, el estado es `BLOCKED`, no `COMPLETED` — quien
  pidió el borrado tiene derecho a saber que la ley lo impidió.

## StorageMaintenanceService

Los tres casos de uso comparten una idea: **la caché y las copias son derivadas**. Cuando el dato
canónico cambia de versión, de sitio o de temperatura, lo derivado tiene que enterarse.

- `invalidateCache` (UC-62-12) — la clave incluye la **versión**: dos proyecciones de la misma
  versión no encolan dos purgas, pero una versión nueva sí.
- `moveData` (UC-62-13) — idempotente por `manifest_hash`; encola la invalidación **siempre**, porque
  después de reubicar un dato la caché apunta a donde ya no está. La migración de esquema sólo si el
  destino lo cambia.
- `archiveData` (UC-62-14) — **la copia caliente sólo se purga con el manifiesto frío confirmado**.
  Es la regla que impide el peor desenlace del caso de uso: borrar lo caliente y descubrir después
  que el archivado no llegó a escribirse. El corte tiene que estar en el pasado.

## Transacciones

Un caso de uso, una transacción. `OutboxService.publishDomainEvent(tx, …)` recibe la transacción
abierta y se enlista en ella.

## Errores

`ConflictException` (409) para códigos repetidos, entidad duplicada en una corrida, entrada de cola
muerta ya reprocesada y solicitud ya cerrada. `PreconditionFailedException` (422) para suscripción
inactiva, deriva cerrada, acción de reparación que no encaja con el tipo, retención legal,
verificación prematura, objetivos sin verificar y manifiesto frío ausente.
`ResourceNotFoundException` (404) para referencias que no resuelven.

## Logs

`operation: 'xstore.<área>.<acción>'`. `warn` en entrega fallida, cola muerta, deriva detectada,
solicitud de borrado, ejecución, referencias residuales, cierre y archivado — en este módulo casi
todo lo que pasa merece atención. No se loguean payloads ni localizadores.
