<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/directory/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `directory`

**Fuente:** [`src/modules/directory/README.md`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/src/modules/directory/README.md)
· 2 controllers · 6 services · 5 repositories · 7 entidades · 16 DTO

---

# Módulo 04 — Directory (Tenants, Sub-tenants, Branches y Membresías)

Gestiona el directorio organizacional de la plataforma: aprovisionamiento y ciclo
de vida de tenants, jerarquía de sub-tenants, sedes físicas (branches) y las
membresías de usuarios a tenant y a branch.

## Endpoints (UC-04-01..10)

| UC | Método y ruta | Rol | Descripción |
|----|---------------|-----|-------------|
| 04-01 | `POST /admin/tenants` | `SUPERADMIN` | Aprovisiona un tenant raíz (`pending`/`unverified`) y su membership owner. |
| 04-02 | `POST /admin/tenants/{tenantId}/verification` | `SECURITY_ADMIN` | Verifica y activa el tenant (`pending→active`, `unverified→verified`). |
| 04-03 | `POST /tenants/{tenantId}/child-tenants` | `SECURITY_ADMIN` | Crea un sub-tenant hijo (`parent_tenant_id`) con membership admin inicial. |
| 04-04 | `POST /tenants/{tenantId}/branches` | `SECURITY_ADMIN` | Crea una branch/sede activa con geolocalización opcional. |
| 04-05 | `POST /tenants/{tenantId}/memberships` | `SECURITY_ADMIN` | Incorpora un usuario al tenant (evita duplicado activo). |
| 04-06 | `POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments` | `SECURITY_ADMIN` | Asigna la membresía a una branch del tenant; fija `primary` si es la primera. |
| 04-07 | `POST /tenants/{tenantId}/memberships/{membershipId}/transfer` | `SECURITY_ADMIN` | Transfiere entre branches (cierra origen, abre destino, mueve `primary`). |
| 04-08 | `PATCH /tenants/{tenantId}/memberships/{membershipId}/role` | `SECURITY_ADMIN` | Cambia rol y/o scope de la membresía. |
| 04-09 | `POST /tenants/{tenantId}/memberships/{membershipId}/offboard` | `SECURITY_ADMIN` | Da de baja la membresía y cierra en cascada sus asignaciones a branch. |
| 04-10 | `POST /admin/tenants/{tenantId}/suspend` | `SUPERADMIN` | Suspende el tenant y cascadea a branches y memberships activos. |

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

Definidos en [`directory.concepts.ts`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/src/modules/directory/directory.concepts.ts) vía
`defineModuleConcepts('directory', {...})`, exportando `DIRECTORY_CONCEPT_SEEDS` y
el mapa `DIR`. Los estados `active`/`verified` de tenant y los tipos de tenant /
entidad legal reutilizan conceptos transversales (`CONCEPTS.*`).

## Permisos, logs y errores

- Guard global de auth; endpoints protegidos por `@Roles('SUPERADMIN'|'SECURITY_ADMIN')`.
- Logs Pino estructurados por operación (`directory.*`), sin secretos ni PHI.
- Excepciones de dominio: `ResourceNotFoundException` (404), `ConflictException`
  (409), `PreconditionFailedException` (422).

## Tests

- Unit: `services/*.service.spec.ts` y `controllers/*.controller.spec.ts`
  (mockean repos/`EntityManager` y servicios). 35 casos.
- Smoke transversal: `test/smoke/modules/directory.smoke.ts` (`DIRECTORY_SMOKE`).

