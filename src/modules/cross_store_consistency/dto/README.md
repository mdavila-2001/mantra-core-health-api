# DTOs — cross_store_consistency

Un solo archivo, `cross-store.dto.ts`, con los cuerpos de entrada, las respuestas y los anidados
(`SubscriptionInputDto`, `ConsistencySloInputDto`, `ReconciliationItemDto`, `DeletionTargetInputDto`).

## MAYÚSCULAS en los estados

Todas las listas cerradas de este módulo van en mayúsculas (`ACTIVE`, `SUCCEEDED`, `DIVERGENT`,
`HARD`, `REPROJECT`), porque así las escribe el caso de uso y la comparación contra la columna
`varchar` es literal. Es la misma convención de `polyglot_storage` y la contraria a la de
`time_series` — conviene no mezclarlas.

## Lo que el cliente no puede decidir

- **Las claves de idempotencia.** Ni la de la entrega ni la de la reparación ni la de la ejecución
  del borrado están en ningún DTO: se derivan por hash en el servicio. Dejar que el llamante las
  declarara permitiría forzar que dos escrituras distintas parecieran la misma, o al revés.
- **`attemptNumber`.** Sale de cuántos intentos lleva el evento o el objetivo.
- **Los estados.** `state` de definiciones, suscripciones, solicitudes y objetivos; `status` de
  intentos, corridas, ejecuciones y jobs. Todos los pone el servicio.
- **`dueAt` de la solicitud de borrado.** Se deriva de `slaDays`; aceptarlo permitiría fijar un plazo
  ya vencido o eterno.
- **`severity` de la deriva.** Sale de la clase de deriva, no de la petición.

`ProcessDeliveryDto.durableWriteConfirmed` y `ExecuteDeletionDto.succeeded` **sí** los declara el
llamante, y es correcto: sólo el worker sabe si el store destino confirmó. Lo que el servicio no
hace es creérselo para avanzar el checkpoint sin más — si es `false`, el checkpoint no se mueve.

## Los `bigint` como cadena

`sourcePosition`, `canonicalVersion`, `entityVersion`, `archivedCount` y `deletedHotCount` se validan
con `@IsNumberString({ no_symbols: true })`. `sourcePosition` es el más importante: por encima de
2^53 un `number` pierde precisión, y ahí es donde un checkpoint empezaría a retroceder sin que nadie
lo note.

`maxDriftRate` es `numeric` y va con `@IsNumberString()` sin `no_symbols`: una tasa sí es decimal.

## `entityVersion` está en la clave, y por eso es obligatorio

`InvalidateCacheDto.entityVersion` no es opcional. Sin él, la clave de deduplicación no distinguiría
dos versiones de la misma entidad, la segunda invalidación se descartaría por duplicada, y la caché
seguiría sirviendo lo viejo. Es el campo cuya ausencia rompería el caso de uso en silencio.

## `blockedByLegalHold` viaja con el objetivo

`DeletionTargetInputDto.blockedByLegalHold` es parte del objetivo, no una comprobación aparte. Quien
inventaría los objetivos —el worker que conoce cada store— es quien sabe si hay una retención sobre
ese dato concreto, y el objetivo bloqueado tiene que quedar **registrado**, no omitido.

## Topes

`MAX_RECONCILIATION_ITEMS` (5000) y `MAX_DELETION_TARGETS` (200) en sus arrays. Rechazar en la
validación cuesta menos que rechazar tras deserializar un lote enorme.

`concurrencyLimit` va de 1 a 100 y `slaDays` de 1 a 365: los dos son topes de cordura, no de negocio.

## Respuestas

`duplicate` aparece en siete DTOs de respuesta, y `checkpointAdvanced`, `requiresReexecution`,
`alreadyClosed` y `targetsSkipped` completan el mismo patrón: en todos esos casos la operación pudo
no hacer nada, o hacer algo distinto de lo pedido, y devolver `2xx` sin decirlo dejaría al worker sin
saber si tiene que reintentar.

`ReconciliationResponseDto.driftsByType` es el resumen que convierte "hay divergencias" en "hay tres
documentos que faltan y uno huérfano" — que es lo que decide qué reparación encolar.

`CloseDeletionResponseDto` devuelve los tres contadores (`verifiedTargets`, `blockedTargets`,
`pendingTargets`) porque juntos son la prueba de cumplimiento: cuántos se borraron de verdad y
cuántos siguen ahí porque la ley lo exige.
