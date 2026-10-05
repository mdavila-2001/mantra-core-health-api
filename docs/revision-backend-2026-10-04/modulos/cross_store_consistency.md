# Revisión del módulo `cross_store_consistency` — ALOVIDA

## Alcance y resultado

Se revisaron los controladores de gobierno y worker, entrega de proyecciones, reconciliación, borrado verificable, mantenimiento y el escáner de objetos. `corepack yarn test src/modules/cross_store_consistency --runInBand --silent` aprobó **6 suites y 99 pruebas**. No se confirmó un fallo dentro del rol declarado del módulo: persiste control, idempotencia, estados y evidencia; los adaptadores que escriben o borran físicamente pertenecen a los workers de cada almacén.

## Evidencia revisada

Los 16 endpoints requieren roles explícitos en [`cross-store-admin.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts#L51-L221) y [`cross-store-worker.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts#L50-L229). La entrega deriva una clave por evento y hash, no adelanta el checkpoint con `durableWriteConfirmed: false`, y bloquea el checkpoint durante el avance ([`projection-delivery.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/cross_store_consistency/services/projection-delivery.service.ts#L126-L250), [`projection.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/cross_store_consistency/repositories/projection.repository.ts#L230-L270)). El borrado sólo cierra con objetivos verificados o bloqueados y diferencia `COMPLETED` de `BLOCKED` ([`deletion.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/cross_store_consistency/services/deletion.service.ts#L327-L449)). El escáner evita inferir huérfanos cuando el inventario está incompleto ([`object-store-reconciliation.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/cross_store_consistency/services/object-store-reconciliation.service.ts#L109-L212)).

## Límite operativo confirmado

El módulo acepta las constataciones `durableWriteConfirmed`, `succeeded` y `verifiedAbsent` desde sus endpoints internos; no ejecuta por sí mismo la escritura, el borrado ni la comprobación en un proveedor ([`projection-delivery.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/cross_store_consistency/services/projection-delivery.service.ts#L126-L250), [`deletion.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/cross_store_consistency/services/deletion.service.ts#L279-L326)). Esto concuerda con su README: es un plano de control. La garantía final depende de que cada worker autenticado obtenga esas constataciones de un adaptador real, no de datos de una llamada arbitraria.

**Plan de cierre:** enlazar cada worker con el adaptador del backend antes de llamar a estas rutas, restringir las credenciales `*_WORKER` a su red y servicio, y añadir integración efímera que pruebe recibo del proveedor y lectura posterior. No elevar a éxito un error de red o respuesta ambigua.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Adaptador confirma escritura y el worker registra entrega | checkpoint avanza una vez y outbox/estado quedan consistentes |
| Límite | Reentrega del mismo evento y hash | intento duplicado, sin segundo efecto ni retroceso del checkpoint |
| Error | Proveedor no confirma borrado o quedan referencias | objetivo vuelve a `PENDING`; solicitud no se cierra |
| Falla catalogada | Intento de cerrar con objetivo pendiente | `422/PRECONDITION_FAILED/CROSS_STORE_DELETION_TARGETS_UNVERIFIED` y razón estable, sin cierre |

## Cobertura pendiente

Las 99 pruebas son unitarias y de delegación. Faltan pruebas de integración contra un backend temporal que demuestren recepción durable, inventario truncado, retención legal y recuperación después de caída entre proveedor y commit. También debe comprobarse que las rutas `/workers` no sean alcanzables con una credencial de usuario normal.
