# authz · dto

DTOs de entrada (`class-validator` + `@nestjs/swagger`) y de salida (solo campos
seguros). Los enums de dominio se exponen como códigos legibles (`ALLOW`/`DENY`,
`TREATMENT`/`EMERGENCY`, `REDACT`/`HASH`…) y el servicio los traduce al
`*_concept_id` correspondiente vía `AUTHZ.*`.

| DTO | Endpoint | UC |
|---|---|---|
| `CreatePermissionCategoryDto` | POST /authz/permission-categories | 06-01 |
| `CreatePermissionDto` | POST /authz/permissions | 06-01 |
| `CreateAccessPolicyDto` | POST /authz/tenants/{tenantId}/access-policies | 06-02 |
| `CreateRoleDto` | POST /authz/roles | 06-03 |
| `SetRolePermissionsDto` | PUT /authz/roles/{roleId}/permissions | 06-03 |
| `CreateRoleAssignmentDto` | POST /authz/users/{userId}/role-assignments | 06-04 |
| `CreatePermissionGrantDto` | POST /authz/users/{userId}/permission-grants | 06-05 |
| `CreateClinicalAccessGrantDto` | POST /authz/patients/{id}/clinical-access-grants | 06-06 |
| `BreakTheGlassDto` | POST /authz/patients/{id}/break-the-glass | 06-07 |
| `SetFieldPermissionsDto` | PUT /authz/roles/{roleId}/field-permissions | 06-08 |
| `CreateResourceScopeGrantDto` | POST /authz/resource-scope-grants | 06-09 |
| `InvalidateCacheDto` | POST /authz/pdp/cache/invalidate | 06-11 |
| `EvaluateDecisionDto` | POST /authz/decisions/evaluate | 06-12 |

Respuestas: `AuthzIdResponseDto`, `RoleResponseDto`, `AuthzStatusResultDto`,
`CacheInvalidationResultDto`, `DecisionResponseDto` (+ `MaskedFieldDto`).
