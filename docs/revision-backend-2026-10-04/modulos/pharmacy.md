# Revisión del módulo `pharmacy` — ALOVIDA

## 1. Alcance y evidencia

- Fecha: 2026-10-05. Lectura focal de controladores, servicios de alta, sedes, productos, precios, integraciones y lectura por tenant.
- `corepack yarn test src/modules/pharmacy --runInBand --silent` → **22 suites y 278 tests pasan**. Emitió dos advertencias de import JSON sin atributo, futuras incompatibilidades de Jest/Node. Las suites no prueban dos tenants ni FKs reales.
- No cubierto: catálogo público completo, proyección externa, todas las reglas regulatorias y consistencia productiva con inventario.

## 2. Resumen

| Severidad | Total | Hallazgos |
|---|---:|---|
| Crítica | 1 | PHARM-01: administración global sin alcance de farmacia/tenant. |
| Alta | 1 | PHARM-02: sede, lista y conexión admiten referencias cruzadas sin relación validada. |
| Media | 1 | PHARM-03: importes monetarios ingresan como `number`. |

La lectura interna sí usa `requireTenantId()` y repositorios visibles por tenant ([pharmacy-read.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/services/pharmacy-read.service.ts#L59-L103)); los comandos administrativos no reutilizan ese perímetro.

## 3. Hallazgos confirmados

### PHARM-01 — Crítica — administración global sin alcance de farmacia o tenant

**Evidencia.** El controlador de mutaciones sólo exige `SECURITY_ADMIN` ([pharmacy.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/controllers/pharmacy.controller.ts#L56-L238)). El alta persiste `dto.tenantId` sin contexto ni membresía del actor ([pharmacies.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/services/pharmacies.service.ts#L52-L115)). Verificación, sedes, productos, listas y conexiones buscan farmacia por UUID y sólo comprueban estado o parentesco local, sin tenant de contexto ([pharmacies.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/services/pharmacies.service.ts#L142-L205), [pharmacy-sites.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/services/pharmacy-sites.service.ts#L37-L103), [pharmacy-products.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/services/pharmacy-products.service.ts#L109-L200), [pharmacy-pricing.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/services/pharmacy-pricing.service.ts#L56-L132), [pharmacy-integration.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/services/pharmacy-integration.service.ts#L53-L127)).

**Impacto.** Un administrador T1 puede crear farmacia bajo T2 o alterar licencias, productos, precios e integraciones de T2 con UUID conocido; también abre el perímetro de PINV-01.

**Plan.** Derivar tenant del contexto; crear `requireManagedPharmacy(tx, pharmacyId, actor)` que compruebe tenant y membresía antes de cada write; sustituir lookups globales de hijos por consultas acotadas al padre autorizado; separar explícitamente los permisos de plataforma intertenant.

| Caso | Preparación e input | Resultado esperado |
|---|---|---|
| Correcto | Integración, admin con membresía T1 muta farmacia T1. | `200/201` y auditoría T1. |
| Límite | Operación plataforma realmente autorizada, si existe. | Coincidencia explícita de tenant. |
| Error | Admin T1 usa farmacia/tenant T2. | Cero cambios T2. |
| Falla catalogada | E2E, UUID T2. | `404`, `RESOURCE_NOT_FOUND`, `PHARMACY_NOT_AVAILABLE`. |

### PHARM-02 — Alta — referencias de sede y relación externa no se validan contra farmacia

**Evidencia.** Crear sede persiste `practiceSiteId` sin cargar ni comparar propiedad ([pharmacy-sites.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/services/pharmacy-sites.service.ts#L73-L88)). Crear lista persiste `pharmacySiteId` e `insurerTenantId` comprobando sólo que la farmacia sea activa ([pharmacy-pricing.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/services/pharmacy-pricing.service.ts#L67-L113)). Crear conexión hace lo mismo con `pharmacySiteId` ([pharmacy-integration.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/services/pharmacy-integration.service.ts#L67-L110)).

**Plan y pruebas.** Resolver sede/práctica/aseguradora dentro del tenant y farmacia autorizados; usar relaciones o constraints compuestas donde sea posible. Probar relación T1 válida, lista general sin sede si el contrato la admite, sede/práctica/aseguradora T2 rechazada sin writes y `404/RESOURCE_NOT_FOUND/PHARMACY_REFERENCE_NOT_AVAILABLE`.

### PHARM-03 — Media — precio monetario entra por `number` de JavaScript

**Evidencia.** Los importes de precio son `@IsNumber` ([create-price.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/dto/create-price.dto.ts#L15-L65)) y se persisten como `String(dto.unitAmount)` y equivalentes ([pharmacy-pricing.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharmacy/services/pharmacy-pricing.service.ts#L197-L215)). Un decimal binario calculado por cliente puede congelarse como `0.30000000000000004`.

**Plan y pruebas.** Aceptar decimal canónico string con escala monetaria; usar decimal exacto; rechazar escala excesiva. Probar `"12.340000"`, unidad mínima, importe con escala inválida y `400/VALIDATION_FAILED/PHARMACY_PRICE_AMOUNT_INVALID`.

## 4. Olas

| Ola | Hallazgos | Esfuerzo | Gate |
|---|---|---:|---|
| 0 | PHARM-01, PHARM-02 | M | integración con dos tenants y cadena farmacia–sede–práctica–aseguradora. |
| 2 | PHARM-03 | M | contrato decimal y regresión de precios. |

Ejecutar tras cada cambio `corepack yarn test src/modules/pharmacy --runInBand --silent` y pruebas de integración con PostgreSQL. Los 278 tests actuales no prueban aislamiento de tenant ni FK reales.
