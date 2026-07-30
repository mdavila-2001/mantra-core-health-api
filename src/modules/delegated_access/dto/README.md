# DTOs — delegated_access

`class-validator` + `class-transformer` + `@nestjs/swagger`. Los enums legibles
(role, scope, purpose, resourceType, delegateType, decision) se traducen a
`*_concept_id` en `services/concept-maps.ts`. Los DTO de respuesta exponen solo
campos seguros.

| DTO | Endpoint |
|-----|----------|
| `CreateOrgUserAssignmentDto` | `POST /org/{id}/user-assignments` |
| `UpdateOrgUserAssignmentDto` | `PATCH /org/user-assignments/{id}` |
| `CreatePermissionSetDto`, `PermissionSetItemDto` | `POST /delegated-permission-sets` |
| `PublishSetVersionDto` | `POST /delegated-permission-sets/{id}/versions` |
| `CreatePractitionerDelegateDto` | `POST /practitioner-delegates` |
| `CreateAccessRequestDto` | `POST /practitioner-delegates/{id}/access-requests` |
| `DecideAccessRequestDto` | `POST /access-requests/{id}/decision` |
| `CreateGrantDto` | `POST /practitioner-delegates/{id}/grants` |
| `RevokeDelegationDto` | `POST /practitioner-delegates/{id}/revoke` |
| `EvaluateActorDto` | `POST /authz/effective-actor/evaluate` |
| Respuestas: `ResourceCreatedDto`, `PermissionSetVersionDto`, `OperationResultDto`, `DecisionResultDto`, `ExpirySweepResultDto`, `EvaluationResultDto` | — |
