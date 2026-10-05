# Revisión del módulo `qa_lab` — ALOVIDA

## Alcance y evidencia

Se revisaron entornos, suites/casos, corridas, resultados, artefactos, defectos, agendas y vistas de administración. `corepack yarn test src/modules/qa_lab --runInBand --silent` aprobó **5 suites y 99 pruebas**.

## Hallazgo confirmado

### QALAB-01 — Crítica — Suites, corridas y evidencia se cargan por UUID sin comparar el tenant activo

Las rutas con roles pasan UUID, DTO y actor ([`qa-lab.controller.ts`](../../../src/modules/qa_lab/controllers/qa-lab.controller.ts#L42-L237)); catálogo, corridas y lecturas cargan suite, entorno, corrida, caso, resultado y defecto por ID sin resolver la pertenencia de tenant antes de mutar o devolver evidencia ([`qa-catalog.service.ts`](../../../src/modules/qa_lab/services/qa-catalog.service.ts#L208-L399), [`qa-runs.service.ts`](../../../src/modules/qa_lab/services/qa-runs.service.ts#L164-L716), [`qa-lab-read.service.ts`](../../../src/modules/qa_lab/services/qa-lab-read.service.ts#L103-L182)). Los DTOs confían en tenant opcional para crear varias cabeceras.

El cotejo global de un `tenantId` de entrada no protege IDs de ruta. Sin RLS obligatoria, QA de A puede publicar suite, ejecutar/finalizar corrida, acceder a payloads/artifacts o hacer triage de defecto de B; es especialmente sensible porque esas filas conservan evidencia de pruebas.

**Plan:** derivar tenant del contexto, buscar cada agregado por `id + tenantId` y encadenar hijos hasta suite/entorno; separar workers de scope global explícito. Asegurar 404 uniforme y pruebas de dos tenants para operaciones y lecturas.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | QA de A publica y ejecuta suite/entorno de A | evidencia y defecto sólo de A |
| Límite | Runner de A reintenta resultado propio idempotente | una sola ejecución/evaluación |
| Error | QA de A adjunta artefacto, finaliza corrida o lee defecto de B | `404`; no se expone ni muta evidencia B |
| Falla catalogada | UUID inexistente o de otro tenant | `404/RESOURCE_NOT_FOUND/QA_LAB_RESOURCE_OUT_OF_SCOPE` |

## Controles verificados

El módulo protege con roles, bloqueos, idempotencia de ejecución/evaluación y enmascara payload fuera de entornos seguros. Las suites unitarias no cubren aislamiento entre tenants.
