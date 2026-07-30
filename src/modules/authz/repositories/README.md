# authz · repositories

Repositorios **stateless** de la capa de datos del módulo de autorización. Cada
método recibe el `EntityManager` activo como primer parámetro para que el servicio
controle la transacción y el repo sea trivialmente mockeable.

Reglas comunes (idénticas a los módulos de referencia):

- Las FK son columnas `uuid` planas (no relaciones ORM); MikroORM no ordena
  inserts → el servicio hace `flush` del padre antes de crear hijos.
- Cada `em.create(...)` usa `{ partial: true }` y `createdBy(actorUserId)`.
- Nunca se fija `rowVersion` (lo maneja el ORM con `DEFAULT 1`).
- Estados/tipos son `*_concept_id`: se usan `CONCEPTS.*` transversales
  (`STATE_ACTIVE`, `STATE_REVOKED`, `STATE_EXPIRED`) y `AUTHZ.*` propios.

| Repositorio | Tabla | Usado por |
|---|---|---|
| `PermissionCategoriesRepository` | `authz.permission_categories` | UC-06-01 |
| `PermissionsRepository` | `authz.permissions` | UC-06-01, PDP |
| `AccessPoliciesRepository` | `authz.access_policies` | UC-06-02, PDP |
| `RolesRepository` | `authz.roles` | UC-06-03, PDP |
| `RolePermissionsRepository` | `authz.role_permissions` | UC-06-03, PDP |
| `UserRoleAssignmentsRepository` | `authz.user_role_assignments` | UC-06-04, PDP |
| `UserPermissionGrantsRepository` | `authz.user_permission_grants` | UC-06-05, UC-06-10, PDP |
| `ClinicalAccessGrantsRepository` | `authz.clinical_access_grants` | UC-06-06/07/10, PDP |
| `BreakGlassSessionsRepository` | `authz.break_glass_sessions` | UC-06-07 |
| `FieldPermissionsRepository` | `authz.field_permissions` | UC-06-08, PDP |
| `ResourceScopeGrantsRepository` | `authz.resource_scope_grants` | UC-06-09, PDP |
