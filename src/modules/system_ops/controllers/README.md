# Controladores de `system_ops`

Capa fina: `@ApiTags`/`@ApiBearerAuth`, `@Roles('SECURITY_ADMIN')`, `@HttpCode`
correcto, `@Param('id', ParseUUIDPipe)`, `@CurrentUser()`; delegan en el servicio.

- `governance-catalog.controller.ts` (`admin/governance`) — UC-11-01..04.
- `retention-execution.controller.ts` (`internal/governance`) — UC-11-05.
- `residency.controller.ts` (`admin/governance`) — UC-11-06/07.
- `legal-hold.controller.ts` (`admin/governance`) — UC-11-08.
- `backup.controller.ts` (`admin/ops`) — UC-11-09.
- `restore-test.controller.ts` (`internal/ops`) — UC-11-10.
- `assessment.controller.ts` (`admin/governance`) — UC-11-11..14.
- `draft.controller.ts` (`admin/governance`) — UC-11-15.

## Lecturas de colección

`SystemOpsCollectionsController` (`system-ops-collections.controller.ts`) expone los `GET` de colección que pedía el catálogo de vistas: `GET /admin/governance/drafts` (V11-01), `GET /admin/governance/legal-holds` (V11-02), `GET /admin/governance/assessments/{id}/remediation-plans` (V11-05), `GET /admin/governance/cross-border-transfers` (V11-06), `GET /admin/governance/tenant-residency-bindings` (V11-16), `GET /admin/governance/workload-assessments` (V11-17), `GET /admin/ops/backup-policies` (V11-20). Cada handler declara el mismo `@Roles(...)` que las escrituras del recurso; la página la acota al tenant del contexto el servicio.
