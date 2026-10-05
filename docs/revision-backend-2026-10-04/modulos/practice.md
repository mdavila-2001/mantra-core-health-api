# Revisión del módulo `practice` — ALOVIDA

## Alcance y evidencia

Se revisaron prácticas, sedes, estructura clínica, servicios, ajustes, personal, acreditaciones, inventario y consultorios propios. `corepack yarn test src/modules/practice --runInBand --silent` aprobó **11 suites y 106 pruebas**.

## Hallazgo confirmado

### PRAC-01 — Crítica — Escrituras administrativas por UUID no se acotan al tenant activo

Las lecturas administrativas recientes sí reciben `requireTenantId()` y comparan `practice.tenantId` antes de devolver datos ([`practices.controller.ts`](../../../src/modules/practice/controllers/practices.controller.ts#L154-L208), [`practice-sites.service.ts`](../../../src/modules/practice/services/practice-sites.service.ts#L153-L208), [`practice-organization-read.service.ts`](../../../src/modules/practice/services/practice-organization-read.service.ts#L80-L93)). Las escrituras administrativas, en cambio, reciben solamente el actor: `POST /practices/:practiceId/sites`, la baja en cascada, acreditaciones, servicios, ajustes, roles e inventario ([`practices.controller.ts`](../../../src/modules/practice/controllers/practices.controller.ts#L222-L305), [`sites.controller.ts`](../../../src/modules/practice/controllers/sites.controller.ts#L43-L93), [`accreditations.controller.ts`](../../../src/modules/practice/controllers/accreditations.controller.ts#L29-L42), [`inventory-items.controller.ts`](../../../src/modules/practice/controllers/inventory-items.controller.ts#L27-L40), [`role-assignments.controller.ts`](../../../src/modules/practice/controllers/role-assignments.controller.ts#L38-L103)).

Sus servicios cargan prácticas, sedes, acreditaciones, roles e insumos mediante `findById` o crean contra el `practiceId` recibido, pero no obtienen ni comparan el tenant activo: alta/baja de sede ([`practice-sites.service.ts`](../../../src/modules/practice/services/practice-sites.service.ts#L211-L344)), estructura y servicio ([`clinical-structure.service.ts`](../../../src/modules/practice/services/clinical-structure.service.ts#L57-L269)), personal y sus transiciones ([`practice-workforce.service.ts`](../../../src/modules/practice/services/practice-workforce.service.ts#L80-L183), [`…#L453-L501`](../../../src/modules/practice/services/practice-workforce.service.ts#L453-L501)), ajustes ([`practice-settings.service.ts`](../../../src/modules/practice/services/practice-settings.service.ts#L37-L78)), acreditaciones ([`practice-accreditations.service.ts`](../../../src/modules/practice/services/practice-accreditations.service.ts#L48-L138)) e inventario ([`practice-inventory.service.ts`](../../../src/modules/practice/services/practice-inventory.service.ts#L55-L168)). Los repositorios correspondientes buscan sólo `{ id }`, por ejemplo prácticas ([`practices.repository.ts`](../../../src/modules/practice/repositories/practices.repository.ts#L91-L93)) e insumos ([`inventory-items.repository.ts`](../../../src/modules/practice/repositories/inventory-items.repository.ts#L60-L62)).

`TenantContextInterceptor` únicamente coteja campos propietarios literales del request (`tenantId` y `custodianTenantId`); un `practiceId`, `siteId`, `roleId`, `itemId` o `accreditationId` no entra en esa comprobación ([`tenant-scope.ts`](../../../src/common/tenant/tenant-scope.ts#L14-L50), [`tenant-context.interceptor.ts`](../../../src/common/tenant/tenant-context.interceptor.ts#L115-L129)). Por ello un `SECURITY_ADMIN` con rol válido en tenant A, que conozca un UUID de B, puede crear o alterar estructura, configuración, personal, acreditaciones o stock de B cuando la capa RLS no esté activa o no cubra las tablas indirectas. La guardia de roles valida el rol del tenant seleccionado, pero estos servicios nunca prueban que el recurso objetivo pertenece a ese tenant.

**Plan:** recibir `requireTenantId()` en todas las escrituras cuyo recurso nace bajo o se resuelve desde una práctica, y centralizar un resolver que cargue la práctica por `id + tenantId` y responda `404` uniforme fuera de alcance. Para `siteId`, `roleId`, `itemId` y `accreditationId`, resolver primero su práctica y aplicar la misma comprobación antes de cualquier transición, creación hija o `flush`. Conservar RLS como defensa adicional, pero cubrir el contrato de aplicación y las rutas por ID con integración de dos tenants.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | `SECURITY_ADMIN` de A crea sede, ajuste e ítem en práctica de A | `201/200`; sólo se modifican filas de A |
| Límite | Administrador de A intenta crear unidad o espacio con `siteId` de B | `404`; no se persiste hijo en B |
| Error | Administrador de A intenta verificar acreditación, mover inventario o transicionar rol de B | `404`; estado y cantidades de B no cambian |
| Falla catalogada | UUID inexistente o perteneciente a otro tenant en cualquier mutación por práctica | `404/RESOURCE_NOT_FOUND/PRACTICE_RESOURCE_OUT_OF_SCOPE` con razón estable |

## Controles verificados

Las lecturas de prácticas, sedes, consola organizacional y vinculaciones sí hacen la comparación explícita de tenant. El flujo de consultorio propio obtiene el tenant del contexto y valida propiedad de la práctica/sede antes de modificarla. El DTO de bootstrap declara `tenantId`, por lo que el interceptor lo contrasta; no se incluye ese alta en el hallazgo. Las pruebas unitarias existentes cubren estados, pertenencia jerárquica y stock insuficiente, pero no ejercitan una mutación administrativa con actor de A y recurso de B.
