# Directory — Controladores

Capa fina: validan parámetros (`ParseUUIDPipe`), aplican `@Roles(...)`, obtienen el
actor con `@CurrentUser()` y delegan en el servicio de dominio. Documentados con
`@ApiTags`/`@ApiBearerAuth`/`@ApiOperation` y `@HttpCode` correcto.

| Controlador              | Base             | UCs                                                                                                                                           |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `AdminTenantsController` | `/admin/tenants` | 01 (`POST /`), 02 (`POST /:tenantId/verification`), 10 (`POST /:tenantId/suspend`)                                                            |
| `TenantsController`      | `/tenants`       | 03 (`child-tenants`), 04 (`branches`), 05 (`memberships`), 06 (`branch-assignments`), 07 (`transfer`), 08 (`PATCH .../role`), 09 (`offboard`) |

Tests unitarios en `*.controller.spec.ts`: mockean el servicio y verifican la
delegación con los argumentos correctos.
