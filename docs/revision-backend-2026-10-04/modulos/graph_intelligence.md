# Revisión del módulo `graph_intelligence` — ALOVIDA

## Alcance y evidencia

Se revisaron proyección, traversal, analítica, purga, controladores, DTOs y repositorios del grafo. `corepack yarn test src/modules/graph_intelligence --runInBand --silent` aprobó **4 suites y 87 pruebas**.

## Hallazgos confirmados

### GRAPH-01 — Crítica — Las mutaciones por UUID no comparan el tenant de la sesión con el recurso cargado

Las rutas de cambio por identificador pasan sólo el UUID, DTO y actor ([`graph-projection.controller.ts`](../../../src/modules/graph_intelligence/controllers/graph-projection.controller.ts#L92-L140), [`graph-query.controller.ts`](../../../src/modules/graph_intelligence/controllers/graph-query.controller.ts#L68-L195)). `startProjectionRun` y `advanceProjectionRun` cargan definición/corrida por ID y usan su tenant sin compararlo al contexto ([`graph-projection.service.ts`](../../../src/modules/graph_intelligence/services/graph-projection.service.ts#L306-L430)); `updateAccessScope` y `triageRuleHit` repiten el patrón ([`graph-traversal.service.ts`](../../../src/modules/graph_intelligence/services/graph-traversal.service.ts#L171-L221), [`graph-analytics.service.ts`](../../../src/modules/graph_intelligence/services/graph-analytics.service.ts#L366-L428)).

El interceptor de tenant sólo coteja `tenantId` y `custodianTenantId` declarados en el request ([`tenant-scope.ts`](../../../src/common/tenant/tenant-scope.ts#L14-L50)); UUIDs de definición, corrida, scope o hit no quedan cubiertos. Así, sin RLS obligatoria, un rol con capacidad de A que conozca un UUID de B puede iniciar/avanzar corridas, ampliar o suspender scopes, y mover hallazgos de B.

**Plan:** recibir el tenant resuelto en cada mutación y buscar cada agregado por `id + tenantId`, con `404` uniforme fuera de alcance. Mantener RLS como defensa adicional e introducir pruebas de dos tenants para cada ruta basada en UUID.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Operador de A inicia y avanza una corrida de definición de A | `201/200`; sólo cambia la corrida de A |
| Límite | Operador de A intenta suspender un scope de B | `404`; no se publica evento para B |
| Error | Analista de A intenta triage de un hit o expirar arista de B | `404`; estado y trazabilidad de B sin cambios |
| Falla catalogada | UUID inexistente o de otro tenant | `404/RESOURCE_NOT_FOUND/GRAPH_RESOURCE_OUT_OF_SCOPE` |

### GRAPH-02 — Alta — El recorrido con contexto de paciente no contrasta consentimiento ni restricción de privacidad

`traverse` y `findPath` aplican el scope, tipo de nodo, propósito y, cuando corresponde, presencia de `patientProfileId` ([`graph-traversal.service.ts`](../../../src/modules/graph_intelligence/services/graph-traversal.service.ts#L224-L373)); no consultan `consent` ni `privacy_restrictions`. El propio README declara que esa comprobación está pendiente. Un scope que exija contexto de paciente acepta el UUID aportado como condición suficiente, aunque el paciente haya restringido el propósito de uso.

**Plan:** antes de recorrer, resolver el sujeto y evaluar consentimiento/restricciones para el propósito declarado; negar sin revelar topología. Cubrir consentimiento activo, revocado y restricción específica de propósito.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Scope y consentimiento activo permiten el propósito solicitado | resultado podado por scope |
| Límite | Consentimiento activo con alcance más restrictivo que el scope | sólo nodos permitidos |
| Error | Consentimiento revocado o restricción que niega el propósito | sin nodos, aristas ni cache escrita |
| Falla catalogada | Consulta con contexto de paciente sin autorización de consentimiento | `403/FORBIDDEN/GRAPH_CONSENT_REQUIRED` |

## Controles verificados

Las rutas no son públicas; los DTO con `tenantId` sí pasan por la comprobación de tenant del interceptor. Los upserts validan que los extremos de una arista pertenezcan al tenant del DTO y el traversal aplica scope antes de consultar cache. Faltan pruebas HTTP de recursos por UUID de otro tenant y de consentimiento.
