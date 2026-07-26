# Controladores — Audit

Capa fina: `@ApiTags`/`@ApiBearerAuth`, `@HttpCode` correcto, `@Roles('SECURITY_ADMIN')`,
`@CurrentUser() actor` y `@Param('id', ParseUUIDPipe)`. Delegan en el servicio y
devuelven un DTO de respuesta.

| Controlador | Prefijo | Endpoints |
|-------------|---------|-----------|
| `AuditController` | `/audit` | `data-access`, `events`, `history/{entity}/{id}`, `integrity/verify`, `retention/apply`, `anomaly/scan`, `third-party-access` |
| `ComplianceController` | `/compliance` | `audit-export` |
| `PrivacyController` | `/privacy` | `dsar` (POST), `dsar/{id}` (PATCH) |
| `ModerationController` | `/moderation` | `decisions` |
