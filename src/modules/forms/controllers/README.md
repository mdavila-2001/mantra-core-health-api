# Forms — Controllers

Capa fina: `@ApiTags` + `@ApiBearerAuth`, validan parámetros
(`@Param('id', ParseUUIDPipe)`), toman el actor con `@CurrentUser()` y delegan en
el servicio. `@Roles('SECURITY_ADMIN')` en operaciones de gobernanza; `@HttpCode`
explícito (201 en creaciones, 200 en transiciones).

| Controlador | Prefijo | Endpoints (UC) |
|-------------|---------|----------------|
| `forms-definition-sets.controller.ts` | `/forms/definition-sets` | UC-09-01, UC-09-03, UC-09-13 |
| `forms-fields.controller.ts` | `/forms` | UC-09-02, UC-09-04, UC-09-05, UC-09-12 |
| `forms-assignments.controller.ts` | `/forms/assignments` | UC-09-06 |
| `forms-instances.controller.ts` | `/forms/instances` | UC-09-07, UC-09-08, UC-09-11 |
| `forms-values.controller.ts` | `/forms/values` | UC-09-09, UC-09-10 |

Tests: `forms-controllers.spec.ts` verifica la delegación al servicio con los
argumentos correctos (servicios mockeados).
