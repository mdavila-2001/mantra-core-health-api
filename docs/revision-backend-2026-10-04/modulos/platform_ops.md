# Revisión del módulo `platform_ops` — ALOVIDA

## Alcance y evidencia

Se revisaron cambios, artefactos, despliegues, incidentes, SLO/error budget, capacidad, runbooks y ejercicios de resiliencia. `corepack yarn test src/modules/platform_ops --runInBand --silent` aprobó **5 suites y 146 pruebas**.

## Hallazgo confirmado

### POPS-01 — Crítica — Recursos operativos se cargan por UUID y el tenant de DTO se confía sin alcance del recurso

Las rutas sólo aplican roles y pasan el UUID, DTO y actor ([`platform-ops.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/platform_ops/controllers/platform-ops.controller.ts#L55-L315)). Los servicios reciben/persisten `dto.tenantId` en altas, y luego cargan health checks, incidentes, cambios, componentes, artefactos, despliegues, runbooks, revisiones y ejercicios por ID sin comparar tenant antes de mutar ([`ops-incidents.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/platform_ops/services/ops-incidents.service.ts#L174-L496), [`ops-releases.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/platform_ops/services/ops-releases.service.ts#L136-L542), [`ops-practices.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/platform_ops/services/ops-practices.service.ts#L93-L442)).

El interceptor global sólo coteja una declaración literal de `tenantId`, no el propietario del UUID de ruta. Sin RLS estricta, un rol de operaciones en A puede aprobar cambios, desplegar/revertir, resolver incidentes, publicar postmortems o cerrar ejercicios de B, con eventos y auditoría atribuidos al actor de A.

**Plan:** derivar tenant del contexto y buscar todo agregado por `id + tenantId`; resolver las relaciones cambio/componente/artefacto/despliegue e incidente/check antes de cada write. Reservar barridos `SYSTEM` para un scope explícito y devolver 404 uniforme fuera de alcance.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Release manager de A aprueba y despliega cambio de A | cambio y despliegue sólo de A |
| Límite | SRE de A actualiza incidente y postmortem propios | transición y timeline idempotentes de A |
| Error | Actor de A revierte despliegue, resuelve incidente o completa ejercicio de B | `404`; ningún estado/evidencia de B cambia |
| Falla catalogada | UUID inexistente o de otro tenant | `404/RESOURCE_NOT_FOUND/PLATFORM_OPS_RESOURCE_OUT_OF_SCOPE` |

## Controles verificados

El módulo tiene gates de despliegue, transacciones, bloqueos y controles de transición sólidos. Las pruebas no incluyen dos tenants ni recursos de ruta de otro tenant.
