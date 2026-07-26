# Servicios — delegated_access

Poseen la unidad de trabajo (`em.transactional`), validan precondiciones y lanzan
excepciones de dominio (`ResourceNotFoundException` → 404, `ConflictException` →
409, `PreconditionFailedException` → 422, `ConcurrencyConflictException` → 409).
Cada escritura relevante deja un asiento en `delegation_events`.

| Servicio | UCs |
|----------|-----|
| `OrgUserAssignmentsService` | UC-29-01 (crear), UC-29-10 (patch/suspender) |
| `PermissionSetsService` | UC-29-02 (crear set + versionar) |
| `PractitionerDelegatesService` | UC-29-03 (crear), UC-29-06 (grant), UC-29-07 (revocar) |
| `AccessRequestsService` | UC-29-04 (solicitar), UC-29-05 (decidir) |
| `DelegatedAccessEvaluationService` | UC-29-08 (barrido), UC-29-09 (evaluar) |

`concept-maps.ts` traduce los enums de los DTO a `*_concept_id`. Specs unitarios
(`*.service.spec.ts`) mockean repositorios y `EntityManager`.
