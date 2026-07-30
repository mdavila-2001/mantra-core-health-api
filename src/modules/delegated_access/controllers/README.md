# Controllers — delegated_access

Capa fina: validan parámetros (`ParseUUIDPipe`), aplican `@Roles('SECURITY_ADMIN')`
sobre el guard global, obtienen el actor con `@CurrentUser()` y delegan en el
servicio. Documentados con `@ApiTags`/`@ApiOperation`/`@ApiBearerAuth`.

| Controller | Rutas / UCs |
|------------|-------------|
| `OrgUserAssignmentsController` | `POST /org/{id}/user-assignments` (01), `PATCH /org/user-assignments/{id}` (10) |
| `DelegatedPermissionSetsController` | `POST /delegated-permission-sets` y `/{id}/versions` (02) |
| `PractitionerDelegatesController` | `POST /practitioner-delegates` (03), `/{id}/access-requests` (04), `/{id}/grants` (06), `/{id}/revoke` (07) |
| `AccessRequestsController` | `POST /access-requests/{id}/decision` (05) |
| `DelegatedAccessAuthzController` | `POST /delegated-access/expiry-sweep` (08), `POST /authz/effective-actor/evaluate` (09) |

Specs (`*.controller.spec.ts`) mockean el servicio y verifican la delegación con
los argumentos correctos.
