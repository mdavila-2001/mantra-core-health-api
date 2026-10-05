# Revisión del módulo `promotions` — ALOVIDA

## Alcance y evidencia

Se revisaron promociones, cupones/redenciones, lealtad, puntos, membresías y referidos. `corepack yarn test src/modules/promotions --runInBand --silent` aprobó **4 suites y 118 pruebas**.

## Hallazgo confirmado

### PROM-01 — Crítica — Programas, promociones, membresías, reglas y redenciones se resuelven por UUID sin alcance de tenant

El módulo coteja `tenantId` en altas, y las lecturas de autoservicio sí derivan tenant/titular; sin embargo las rutas administrativas y de operación cargan programa, promoción, membresía, regla, cupón, redención y referido por ID sin comparar el tenant de sesión ([`promotions-discounts.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/promotions/services/promotions-discounts.service.ts#L108-L260), [`…#L420-L545`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/promotions/services/promotions-discounts.service.ts#L420-L545), [`promotions-loyalty.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/promotions/services/promotions-loyalty.service.ts#L294-L455), [`loyalty.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/promotions/controllers/loyalty.controller.ts#L185-L313)). Los repositorios `findProgramById` y equivalentes consultan sólo UUID.

Un administrador/cajero de A que conozca IDs de B puede emitir cupones, canjear/revertir descuentos, alterar membresías o calificar referidos de B. El actor se registra como autor, pero no demuestra permiso sobre el agregado objetivo.

**Plan:** usar el tenant resuelto como autoridad y resolver programa/promoción y todos los hijos por `id + tenantId`; para membresía, cupón, redención y referido, encadenar hasta programa/promoción antes de bloquear. Mantener el autoservicio `me` y añadir pruebas de dos tenants.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Admin de A emite cupón y procesa membresía de A | filas y saldo sólo de A |
| Límite | Reintento propio con misma idempotency key | una sola entrada de ledger/redención |
| Error | Cajero/admin de A emite, revierte o canjea recurso UUID de B | `404`; saldo/cupón/redención B sin cambios |
| Falla catalogada | UUID inexistente o de otro tenant | `404/RESOURCE_NOT_FOUND/PROMOTIONS_RESOURCE_OUT_OF_SCOPE` |

## Controles verificados

El autoservicio de paciente deriva titular y tenant, y el ledger, cupón y referidos usan bloqueos/idempotencia. Las rutas por UUID no reutilizan esas garantías de alcance.
