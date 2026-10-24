# authz · controllers

Capa fina: valida parámetros (`ParseUUIDPipe`), aplica `@Roles(...)` cuando la
operación es administrativa y delega en el servicio. `@CurrentUser()` inyecta el
actor autenticado (guard global `JwtAuthGuard`).

| Controller | Rutas | UCs | Rol |
|---|---|---|---|
| `AuthzCatalogController` | POST `/authz/permission-categories`, POST `/authz/permissions` | 06-01 | SECURITY_ADMIN |
| `AuthzPoliciesController` | POST `/authz/tenants/:tenantId/access-policies` | 06-02 | SECURITY_ADMIN |
| `AuthzRolesController` | POST `/authz/roles`, PUT `/authz/roles/:roleId/permissions`, PUT `/authz/roles/:roleId/field-permissions` | 06-03, 06-08 | SECURITY_ADMIN |
| `AuthzGrantsController` | POST `/authz/users/:userId/role-assignments`, POST `/authz/users/:userId/permission-grants`, POST `/authz/resource-scope-grants` | 06-04, 06-05, 06-09 | SECURITY_ADMIN |
| `AuthzClinicalController` | POST `/authz/patients/:id/clinical-access-grants`, POST `/authz/patients/:id/break-the-glass`, DELETE `/authz/clinical-access-grants/:grantId` | 06-06, 06-07, 06-10 | autenticado (clínico/paciente); revocar → SECURITY_ADMIN |
| `AuthzPdpController` | POST `/authz/pdp/cache/invalidate`, POST `/authz/decisions/evaluate` | 06-11, 06-12 | SECURITY_ADMIN |

## Enrutado de `decisions:evaluate`

La spec nombra `POST /authz/decisions:evaluate`. En Express 5 / path-to-regexp v8
el `:` inicia un parámetro nombrado, así que se sirve en la ruta equivalente
`POST /authz/decisions/evaluate`.

## Lecturas de colección

`AuthzCollectionsController` (`authz-collections.controller.ts`) expone los `GET` de colección que pedía el catálogo de vistas: `GET /authz/clinical-access-grants` (V06-03, V06-06), `GET /authz/resource-scope-grants` (V06-10), `GET /authz/tenants/{tenantId}/access-policies` (V06-14), `GET /authz/users/{userId}/permission-grants` (V06-15). Cada handler declara el mismo `@Roles(...)` que las escrituras del recurso; la página la acota al tenant del contexto el servicio.
