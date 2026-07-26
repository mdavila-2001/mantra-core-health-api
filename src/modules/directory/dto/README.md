# Directory — DTOs

Contratos de entrada/salida con `class-validator` + `@nestjs/swagger`. Los DTOs de
respuesta exponen solo campos seguros (ids y estados como `*_concept_id`).

## Entrada

- `CreateTenantDto` — `POST /admin/tenants` (UC-04-01).
- `VerifyTenantDto` — `POST /admin/tenants/{id}/verification` (UC-04-02).
- `CreateChildTenantDto` — `POST /tenants/{id}/child-tenants` (UC-04-03).
- `CreateBranchDto` — `POST /tenants/{id}/branches` (UC-04-04); lat/long validadas.
- `CreateMembershipDto` — `POST /tenants/{id}/memberships` (UC-04-05).
- `BranchAssignmentDto` — branch-assignments (UC-04-06).
- `TransferMembershipDto` — transfer (UC-04-07).
- `ChangeMembershipRoleDto` — role (UC-04-08).
- `SuspendTenantDto` — suspend (UC-04-10).

Los códigos de rol (`OWNER`/`ADMIN`/`STAFF`), scope (`ALL_TENANT`/`BRANCH`) y tipo
de branch (`CLINIC`/`OFFICE`) se reciben como enums y se mapean a `*_concept_id` en
la capa de servicio (ver `directory.concepts.ts`).

## Respuesta

- `TenantResponseDto`, `BranchResponseDto`, `MembershipResponseDto`,
  `BranchMembershipResponseDto`, `StatusResultDto`.
