# Directory — Repositorios

Acceso a datos de `directory.*`. Stateless: cada método recibe el `EntityManager`
activo como primer parámetro, de modo que el servicio controla la transacción y
varios repositorios participan en el mismo `flush` atómico. No contienen reglas de
negocio (solo consultas y construcción de entidades con `createdBy(...)` y
`{ partial: true }`).

| Repositorio | Entidad | Métodos clave |
|-------------|---------|---------------|
| `TenantsRepository` | `tenants` | `findById`, `findByCode`, `create` |
| `BranchesRepository` | `branches` | `findById`, `findByTenantAndCode`, `findByTenantAndStatus`, `create` |
| `TenantMembershipsRepository` | `tenant_memberships` | `findById`, `findByIdInTenant`, `findActiveByUserTenant`, `findByTenantAndStatus`, `create` |
| `BranchMembershipsRepository` | `branch_memberships` | `findByMembershipAndStatus`, `findByMembershipBranchStatus`, `create` |

Las FK son columnas uuid planas (no relaciones ORM): el servicio hace `flush` del
padre antes de crear el hijo.
