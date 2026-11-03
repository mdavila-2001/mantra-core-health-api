# Controladores de `system_ops`

Capa fina: `@ApiTags`/`@ApiBearerAuth`, `@Roles('SECURITY_ADMIN')`, `@HttpCode`
correcto, `@Param('id', ParseUUIDPipe)`, `@CurrentUser()`; delegan en el servicio.

- `governance-catalog.controller.ts` (`admin/governance`) — UC-11-01..04.
- `governance-read.controller.ts` (`admin/governance`) — lecturas del portal: políticas (lista y detalle), bitácora de cambios y registro de entidades y campos (roles `GOVERNANCE_VIEW_ROLES`). El inventario de datos personales NO vive acá: es `GET /admin/catalog/pii/*` de `data_catalog`.
- `retention-execution.controller.ts` (`internal/governance`) — UC-11-05.
- `residency.controller.ts` (`admin/governance`) — UC-11-06/07.
- `legal-hold.controller.ts` (`admin/governance`) — UC-11-08.
- `backup.controller.ts` (`admin/ops`) — UC-11-09.
- `restore-test.controller.ts` (`internal/ops`) — UC-11-10.
- `assessment.controller.ts` (`admin/governance`) — UC-11-11..14.
- `draft.controller.ts` (`admin/governance`) — UC-11-15.
