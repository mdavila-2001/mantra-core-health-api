# Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías)

Gestiona el directorio organizacional de la plataforma: aprovisionamiento y ciclo
de vida de tenants, jerarquía de sub-tenants, sedes físicas (branches) y las
membresías de usuarios a tenant y a branch.

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
  [revisión ALOVIDA](../../../docs/revision-backend-2026-10-04/modulos/directory.md).

## Tests

- `corepack yarn test src/modules/directory --runInBand --silent`: 14 suites y
  192 pruebas aprobadas durante la revisión.
- Smoke transversal: `test/smoke/modules/directory.smoke.ts` (`DIRECTORY_SMOKE`).
