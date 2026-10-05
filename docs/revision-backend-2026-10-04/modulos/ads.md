# Revisión del módulo `ads` — ALOVIDA

## Alcance y evidencia

Se revisaron cuentas, campañas, targeting, cortafuegos de datos de evento, conversiones, experimentos, reglas, facturación y leads. `corepack yarn test src/modules/ads --runInBand --silent` aprobó **5 suites y 115 pruebas**. Los controladores declaran roles operativos por ruta ([`ads.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/ads/controllers/ads.controller.ts#L42-L390)); servicios usan transacciones y bloqueos para gasto, reglas y estados.

## Hallazgo confirmado

### ADS-01 — Media — La suite no prueba aislamiento entre tenants ni propiedad de cadenas de anuncios

El módulo recibe `tenantId` en DTOs de cuenta, conexiones, política de eventos, conversiones y leads, mientras muchas mutaciones cargan sus agregados sólo por UUID, por ejemplo cuenta, campaña, conjunto, anuncio, dataset y formulario ([`ads-accounts.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/ads/services/ads-accounts.service.ts#L90-L310), [`ads-campaigns.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/ads/services/ads-campaigns.service.ts#L116-L540), [`ads-data.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/ads/services/ads-data.service.ts#L190-L620), [`ads-optimization.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/ads/services/ads-optimization.service.ts#L128-L740)). La aplicación puede depender de la resolución de tenant/RLS, pero las cinco suites existentes usan repositorios mockeados y no verifican que un actor o un payload de tenant A no encadene recursos de tenant B.

No se afirma un bypass sin ejecutar la política real de base de datos; se confirma que la regresión no demostraría su ausencia. En publicidad, mezclar una cuenta, dataset o formulario ajeno puede facturar, entregar conversiones o exponer respuestas de lead en el tenant incorrecto.

**Plan:** añadir integración con RLS habilitado y una política de servicio explícita para cada cadena `tenant → business manager → cuenta → campaña/conjunto/anuncio`, `tenant → dataset → conversión` y `tenant → formulario → lead`. Rechazar cualquier relación cruzada antes de crear efecto. Pasar tenant derivado del contexto, no el DTO, a las consultas de escritura.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | `AD_OPS` del tenant A lanza campaña de su cuenta | `201`, campaña y derivados en A |
| Límite | Reingesta del mismo insight diario | `200`, rollup idempotente por delta |
| Error | Dataset de A con evento que solicita tenant B | `404/RESOURCE_NOT_FOUND/ADS_DATASET_NOT_FOUND`, sin conversión |
| Falla catalogada | Lead o factura contra UUID de cuenta/formulario ajeno | `404/RESOURCE_NOT_FOUND/ADS_RESOURCE_NOT_FOUND` y razón estable, sin fila ni gasto |

## Controles a conservar

El servicio de campañas exige que conjuntos, identidades y presupuestos pertenezcan a la cuenta correspondiente. El servicio de datos aplica deduplicación y política de campos antes de aceptar conversiones. Preservar esos controles y probarlos con entidades reales de dos tenants.
