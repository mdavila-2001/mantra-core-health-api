# Revisión del módulo `procedures_perioperative` — ALOVIDA

## Alcance y evidencia

Se revisaron programación, preoperatorio, anestesia, intraoperatorio, PACU, cargos y lecturas del caso. `corepack yarn test src/modules/procedures_perioperative --runInBand --silent` aprobó **6 suites y 149 pruebas**; produjo dos advertencias JSON preexistentes.

## Hallazgo confirmado

### PERIOP-01 — Crítica — Detalle y equipo de caso por UUID ignoran el tenant del contexto

La agenda recibe `requireTenantId()` y filtra por `custodianTenantId` ([`periop.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/procedures_perioperative/controllers/periop.controller.ts#L55-L79), [`periop-cases.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/procedures_perioperative/services/periop-cases.service.ts#L901-L930)). En cambio `GET /procedure-cases/:id` y `GET /procedure-cases/:id/team-members` no reciben tenant ni actor; `getCaseDetail` y `listTeamMembers` cargan con `findCaseById(this.em, caseId)` y devuelven diagnóstico, órdenes, valoración, anestesia, pasos, hallazgos e implantes ([`periop-cases.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/procedures_perioperative/services/periop-cases.service.ts#L935-L1129)). El repositorio consulta sólo `{ id }` ([`periop-cases.repository.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/procedures_perioperative/repositories/periop-cases.repository.ts#L184-L202)).

Un rol perioperatorio de tenant A que conozca el UUID de un caso de B puede leer datos clínicos y composición de equipo de B si RLS no cubre esa identidad. La inconsistencia entre lista protegida y detalle es evidencia directa de la falta de alcance de aplicación.

**Plan:** pasar tenant y actor al detalle/equipo; sustituir la consulta por `id + custodianTenantId`, aplicar autorización clínica al paciente y responder `404` uniforme fuera de alcance. Usar el mismo resolver en todas las mutaciones que cargan caso por ID.

| Caso | Prueba dirigida | Resultado esperado |
| --- | --- | --- |
| Correcto | Integrante autorizado del tenant consulta caso propio | `200`, detalle completo |
| Límite | Agenda y detalle del mismo caso | ambos resuelven el mismo tenant |
| Error | Rol perioperatorio de A pide UUID de B | `404`, sin datos ni equipo |
| Falla catalogada | Tenant ausente o recurso fuera de alcance | `404/RESOURCE_NOT_FOUND/PERIOP_CASE_NOT_FOUND` con razón estable |
