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
