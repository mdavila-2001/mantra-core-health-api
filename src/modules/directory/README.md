# Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías)

Gestiona el directorio organizacional de la plataforma: aprovisionamiento y ciclo
de vida de tenants, jerarquía de sub-tenants, sedes físicas (branches) y las
membresías de usuarios a tenant y a branch.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/directory -name '*.controller.ts' | wc -l
  find src/modules/directory -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/directory -name '*.entity.ts' | wc -l
  find src/modules/directory -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **3 controllers, 22 rutas HTTP, 7 entidades y 10 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`CommunityModule`, `InsuranceModule`, `TerminologyModule`, `DiagnosticUnitsModule`, `CommonModule`, `DirectoryAuthorizationModule`).

Entidades (`tableName`, 7 de 7 archivos `*.entity.ts`): `branch_memberships`, `branches`, `tenant_affiliation_documents`, `tenant_legal_representatives`, `tenant_memberships`, `tenant_web_configs`, `tenants`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `GET /admin/tenants` | SUPERADMIN, SECURITY_ADMIN | `admin-tenants` |
| `POST /admin/tenants` | SUPERADMIN | `admin-tenants` |
| `POST /admin/tenants/:tenantId/verification` | SECURITY_ADMIN | `admin-tenants` |
| `PUT /admin/tenants/:tenantId/public-profile` | SUPERADMIN, SECURITY_ADMIN | `admin-tenants` |
| `POST /admin/tenants/:tenantId/suspend` | SUPERADMIN | `admin-tenants` |
| `GET /tenants/:tenantId/logo` | sesión | `organization-logo` |
| `PUT /tenants/:tenantId/logo` | sesión | `organization-logo` |
| `GET /tenants/:tenantId/logo/content` | sesión | `organization-logo` |
| `GET /tenants/me` | sesión | `tenants` |
| `PATCH /tenants/:tenantId` | sesión | `tenants` |
| `GET /tenants/:tenantId` | sesión | `tenants` |
| `GET /tenants/:tenantId/child-tenants` | sesión | `tenants` |
| `GET /tenants/:tenantId/branches` | sesión | `tenants` |
| `GET /tenants/:tenantId/memberships` | sesión | `tenants` |
| `GET /tenants/:tenantId/memberships/:membershipId/branch-assignments` | sesión | `tenants` |
| `POST /tenants/:tenantId/child-tenants` | SECURITY_ADMIN | `tenants` |
| `POST /tenants/:tenantId/branches` | sesión | `tenants` |
| `POST /tenants/:tenantId/memberships` | sesión | `tenants` |
| `POST /tenants/:tenantId/memberships/:membershipId/branch-assignments` | sesión | `tenants` |
| `POST /tenants/:tenantId/memberships/:membershipId/transfer` | sesión | `tenants` |
| `PATCH /tenants/:tenantId/memberships/:membershipId/role` | sesión | `tenants` |
| `POST /tenants/:tenantId/memberships/:membershipId/offboard` | sesión | `tenants` |

## Endpoints (UC-04-01..10)

| UC    | Método y ruta                                                            | Rol              | Descripción                                                                   |
| ----- | ------------------------------------------------------------------------ | ---------------- | ----------------------------------------------------------------------------- |
| 04-01 | `POST /admin/tenants`                                                    | `SUPERADMIN`     | Aprovisiona un tenant raíz (`pending`/`unverified`) y su membership owner.    |
| 04-02 | `POST /admin/tenants/{tenantId}/verification`                            | `SECURITY_ADMIN` | Verifica y activa el tenant (`pending→active`, `unverified→verified`).        |
| 04-03 | `POST /tenants/{tenantId}/child-tenants`                                 | `SECURITY_ADMIN` | Crea un sub-tenant hijo (`parent_tenant_id`) con membership admin inicial.    |
| 04-04 | `POST /tenants/{tenantId}/branches`                                      | Owner/admin del tenant o plataforma | Crea una branch/sede activa con geolocalización opcional. |
| 04-05 | `POST /tenants/{tenantId}/memberships`                                   | Owner/admin del tenant o plataforma | Incorpora un usuario al tenant (evita duplicado activo). |
| 04-06 | `POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments` | Owner/admin del tenant o plataforma | Asigna la membresía a una branch del tenant; fija `primary` si es la primera. |
| 04-07 | `POST /tenants/{tenantId}/memberships/{membershipId}/transfer`           | Owner/admin del tenant o plataforma | Transfiere entre branches (cierra origen, abre destino, mueve `primary`). |
| 04-08 | `PATCH /tenants/{tenantId}/memberships/{membershipId}/role`              | Owner/admin; OWNER para ownership | Cambia rol y/o scope de la membresía. |
| 04-09 | `POST /tenants/{tenantId}/memberships/{membershipId}/offboard`           | Owner/admin; OWNER para ownership | Da de baja la membresía y cierra en cascada sus asignaciones a branch. |
| 04-10 | `POST /admin/tenants/{tenantId}/suspend`                                 | `SUPERADMIN`     | Suspende el tenant y cascadea a branches y memberships activos.               |

## Entidades

`directory.tenants`, `directory.branches`, `directory.tenant_memberships`,
`directory.branch_memberships` (más `tenant_affiliation_documents`,
`tenant_legal_representatives`, `tenant_web_configs`, no expuestas por estos UCs).

## Reglas de negocio

- `code` de tenant es único global; `code` de branch es único por tenant.
- Verificación solo desde `pending`; creación de branch/child/membership exige
  tenant `active`; asignación/transferencia/rol/offboard exigen membresía `active`.
- Una branch usada en asignación/transferencia debe pertenecer al mismo tenant.
- No se permite más de una membresía activa por (usuario, tenant).
- Suspensión y offboarding son en cascada dentro de una única transacción.

## Conceptos

Definidos en [`directory.concepts.ts`](./directory.concepts.ts) vía
`defineModuleConcepts('directory', {...})`, exportando `DIRECTORY_CONCEPT_SEEDS` y
el mapa `DIR`. Los estados `active`/`verified` de tenant y los tipos de tenant /
entidad legal reutilizan conceptos transversales (`CONCEPTS.*`).

## Permisos, logs y errores

- Guard global de auth; administración interna decidida por membresía activa de
  tenant y plataformas; el ownership exige OWNER.
- Logs Pino estructurados por operación (`directory.*`), sin secretos ni PHI.
- La falta de `reason` estable en varias denegaciones está documentada en la
  [revisión ALOVIDA](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/directory.md).

## Tests

- `corepack yarn test src/modules/directory --runInBand --silent`: 14 suites y
  192 pruebas aprobadas durante la revisión.
- Smoke transversal: `test/smoke/modules/directory.smoke.ts` (`DIRECTORY_SMOKE`).
