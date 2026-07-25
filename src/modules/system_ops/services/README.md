# Servicios de `system_ops`

Poseen la unidad de trabajo (`em.transactional`) y aplican las reglas de negocio.
`flush` del padre antes de crear hijos; auditoría con `createdBy`/`touch`; nunca se
fija `row_version`. Excepciones de dominio (`ResourceNotFoundException`,
`ConflictException`, `PreconditionFailedException`).

- `governance-catalog.service.ts` — UC-11-01..04.
- `retention-execution.service.ts` — UC-11-05 (excluye objetivos bajo legal hold).
- `residency.service.ts` — UC-11-06/07.
- `legal-hold.service.ts` — UC-11-08.
- `backup.service.ts` — UC-11-09/10.
- `assessment.service.ts` — UC-11-11..14.
- `draft.service.ts` — UC-11-15.
