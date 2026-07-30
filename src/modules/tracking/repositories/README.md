# Repositorios de seguimiento

Acceso a `tracking.*` con MikroORM. Sin reglas de negocio.

## Fuente de datos

PostgreSQL, schema `tracking`. Entidades generadas por introspección. Las altas usan
`em.create(..., { partial: true })` **sin flush**: lo cierra la transacción del servicio.

## Repositorio

Un solo repositorio, `TrackingRepository`, sobre `trackable_subjects`, `shipments`,
`milestone_definitions`, `tracking_events`, `shipment_handoffs`, `eta_estimates`, `delivery_proofs`
y `tracking_carriers`.

No se divide porque el módulo tiene un único agregado —el sujeto rastreable— y todo lo demás cuelga
de él o de su envío. Partirlo obligaría a que cada servicio inyectara los dos trozos en cada
operación.

## Lecturas con bloqueo

`findSubjectForUpdate` y `findShipmentForUpdate` se usan en **toda** operación que mueva el timeline:
el estado del sujeto y el del envío avanzan juntos y no pueden leerse desincronizados.
`findShipmentBySubjectForUpdate` cumple lo mismo desde el lado del webhook, que llega identificado
por número de seguimiento y no por envío.

`findOpenSubjectsForScan` usa `LockMode.PESSIMISTIC_PARTIAL_WRITE` (FOR UPDATE SKIP LOCKED): el
barrido de SLA corre por lotes y saltar lo que otra pasada ya tiene tomado es lo correcto.

## Lecturas de idempotencia

`findEventByExternalReference` es la clave del webhook: busca por `(sujeto, descripción)`, donde la
descripción es la referencia estable `carrierCode:externalEventId`. Sin ella, cada reentrega del
transportista añadiría una fila al timeline.

`findOpenSubjectByRef` impide abrir dos seguimientos de la misma entidad. `findVerifiedProof` impide
una segunda prueba de entrega verificada. `findSubjectByTrackingNumber` y `findShipmentByNumber`
contrastan los correlativos antes de chocar con la UNIQUE.

## Evidencia inmutable

`createEvent`, `createHandoff` y `createEtaEstimate` sólo insertan. No hay método de actualización ni
de borrado para esas tablas: el timeline, los traspasos y el histórico de estimaciones son el
registro de lo ocurrido, y su valor depende de que no se pueda reescribir.

## Lecturas ordenadas

`findMilestonesBySubjectType` devuelve los hitos por ordinal —de ahí sale cuál es el siguiente
pendiente en el barrido de SLA—. `findEventsBySubject` y `findLatestEstimate` van de lo más reciente
a lo más antiguo, porque es lo vigente lo que se consulta.

## Rendimiento

Consultas por PK, FK, clave natural (número de seguimiento, número de envío, código de
transportista) o referencia externa, todas indexadas. El barrido acota con `limit` y ordena por
apertura. Sin N+1.

## Pruebas

Se ejercitan desde el spec de servicio, donde va mockeado. La cobertura real de los bloqueos, del
SKIP LOCKED y de las UNIQUE llega con las pruebas de integración.
