# Revisión del módulo `terminology` — ALOVIDA

## Alcance y evidencia

- Fecha: 2026-10-05. Revisión de políticas por tenant, conceptos, ValueSets, sistemas de códigos e importación.
- `corepack yarn test src/modules/terminology --runInBand --silent` → **26 suites y 302 tests pasan**. No cubre autorización con dos tenants ni límite de lotes en HTTP.

## Hallazgos confirmados

### TERM-01 — Crítica — política de catálogo de cualquier tenant modificable con rol global

La ruta `PUT /terminology/tenants/:tenantId/catalog-policies` exige sólo `SECURITY_ADMIN` y pasa el `tenantId` de ruta sin contrastarlo contra contexto/membresía ([terminology-tenant-catalog.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/terminology/controllers/terminology-tenant-catalog.controller.ts#L24-L53)). El servicio persiste política y configuraciones para ese tenant; sólo comprueba existencia global de ValueSet y conceptos ([tenant-catalog.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/terminology/services/tenant-catalog.service.ts#L57-L220)).

Un admin T1 puede deshabilitar, renombrar o fijar defaults del catálogo de T2, alterando la validación y presentación de múltiples módulos. Derivar tenant de contexto y comprobar membresía/permiso de gestión antes de bloquear/escribir; ocultar T2 como inexistente. Probar T1 correcto, tenant T2 sin writes y `404/RESOURCE_NOT_FOUND/TERMINOLOGY_TENANT_NOT_AVAILABLE`.

### TERM-02 — Media — configuraciones e importaciones por lote no fijan máximo de elementos

`concepts` de política no tiene `ArrayMaxSize` ([tenant-catalog-policy.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/terminology/dto/tenant-catalog-policy.dto.ts#L154-L165)); el servicio hace lookup y flush por cada elemento ([tenant-catalog.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/terminology/services/tenant-catalog.service.ts#L163-L200)). Otros DTO de importación, ValueSet, designaciones y propiedades también aceptan arrays sin tope ([import-concepts.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/terminology/dto/import-concepts.dto.ts#L50-L60), [create-value-set.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/terminology/dto/create-value-set.dto.ts#L110-L125)).

Definir máximo, deduplicar y usar inserción por lote; probar máximo permitido, máximo+1 sin writes y `400/VALIDATION_FAILED/TERMINOLOGY_BATCH_TOO_LARGE`.

## Olas

| Ola | Hallazgo | Esfuerzo |
|---|---|---:|
| 0 | TERM-01 | M |
| 2 | TERM-02 | S |
