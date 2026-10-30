# Practice · controllers

Capa fina HTTP: valida parámetros (`ParseUUIDPipe`), toma `@CurrentUser()` y delega
en el servicio. Todos exigen `@Roles('SECURITY_ADMIN')` sobre el guard global de
auth. Sin prefijo global: las rutas son las del PUML.

| Controlador                       | Raíz                | Endpoints (UC)                                                                                                                                                                                                                                                   |
| --------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PracticesController`             | `/practices`        | `POST /` (bootstrap) · `POST /:id/sites` (01) · `DELETE /:id/sites/:siteId` (12) · `POST /:id/accreditations` (02) · `POST /:id/healthcare-services` (06) · `PUT /:id/settings/:key` (07) · `POST /:id/role-assignments` (08) · `POST /:id/inventory-items` (10) |
| `SitesController`                 | `/sites`            | `POST /:siteId/clinical-units` (04) · `POST /:siteId/care-spaces` (05)                                                                                                                                                                                           |
| `AccreditationsController`        | `/accreditations`   | `POST /:id/verify` (03)                                                                                                                                                                                                                                          |
| `RoleAssignmentsController`       | `/role-assignments` | `POST /:roleId/support-assignments` (09)                                                                                                                                                                                                                         |
| `InventoryItemsController`        | `/inventory-items`  | `POST /:itemId/movements` (11)                                                                                                                                                                                                                                   |
| `OrganizationPracticesController` | `/tenants`          | `POST /:tenantId/practices` (CM-11): la organización verificada abre su práctica y su primera sede. Sin `@Roles`: la regla es la membresía OWNER/ADMIN de esa organización (403 si no), organización verificada (422) y nombre no repetido (409)                 |

`OrganizationPracticesController` es la excepción a `@Roles('SECURITY_ADMIN')`: lo
decide el servicio con `TenantAdministrationService.assertCanAdminister`.
