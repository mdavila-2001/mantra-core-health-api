<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/directory/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver README.md de la raíz, tabla "Arquitectura y mapa").
-->

# Módulo `directory`

**Fuente:** [`src/modules/directory/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/directory/README.md)
· 3 controllers · 12 services · 5 repositories · 9 entidades · 22 DTO

---

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

El módulo tiene **3 controllers, 22 rutas HTTP, 7 entidades y 10 servicios**. La columna _Acceso_ sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`CommunityModule`, `InsuranceModule`, `TerminologyModule`, `DiagnosticUnitsModule`, `CommonModule`, `DirectoryAuthorizationModule`).

Entidades (`tableName`, 7 de 7 archivos `*.entity.ts`): `branch_memberships`, `branches`, `tenant_affiliation_documents`, `tenant_legal_representatives`, `tenant_memberships`, `tenant_web_configs`, `tenants`.

| Método y ruta                                                          | Acceso                     | Controller          |
| ---------------------------------------------------------------------- | -------------------------- | ------------------- |
| `GET /admin/tenants`                                                   | SUPERADMIN, SECURITY_ADMIN | `admin-tenants`     |
| `POST /admin/tenants`                                                  | SUPERADMIN                 | `admin-tenants`     |
| `POST /admin/tenants/:tenantId/verification`                           | SECURITY_ADMIN             | `admin-tenants`     |
| `PUT /admin/tenants/:tenantId/public-profile`                          | SUPERADMIN, SECURITY_ADMIN | `admin-tenants`     |
| `POST /admin/tenants/:tenantId/suspend`                                | SUPERADMIN                 | `admin-tenants`     |
| `GET /tenants/:tenantId/logo`                                          | sesión                     | `organization-logo` |
| `PUT /tenants/:tenantId/logo`                                          | sesión                     | `organization-logo` |
| `GET /tenants/:tenantId/logo/content`                                  | sesión                     | `organization-logo` |
| `GET /tenants/me`                                                      | sesión                     | `tenants`           |
| `PATCH /tenants/:tenantId`                                             | sesión                     | `tenants`           |
| `GET /tenants/:tenantId`                                               | sesión                     | `tenants`           |
| `GET /tenants/:tenantId/child-tenants`                                 | sesión                     | `tenants`           |
| `GET /tenants/:tenantId/branches`                                      | sesión                     | `tenants`           |
| `GET /tenants/:tenantId/memberships`                                   | sesión                     | `tenants`           |
| `GET /tenants/:tenantId/memberships/:membershipId/branch-assignments`  | sesión                     | `tenants`           |
| `POST /tenants/:tenantId/child-tenants`                                | SECURITY_ADMIN             | `tenants`           |
| `POST /tenants/:tenantId/branches`                                     | sesión                     | `tenants`           |
| `POST /tenants/:tenantId/memberships`                                  | sesión                     | `tenants`           |
| `POST /tenants/:tenantId/memberships/:membershipId/branch-assignments` | sesión                     | `tenants`           |
| `POST /tenants/:tenantId/memberships/:membershipId/transfer`           | sesión                     | `tenants`           |
| `PATCH /tenants/:tenantId/memberships/:membershipId/role`              | sesión                     | `tenants`           |
| `POST /tenants/:tenantId/memberships/:membershipId/offboard`           | sesión                     | `tenants`           |

## Endpoints (UC-04-01..10)

| UC    | Método y ruta                                                            | Rol                                 | Descripción                                                                   |
| ----- | ------------------------------------------------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------- |
| 04-01 | `POST /admin/tenants`                                                    | `SUPERADMIN`                        | Aprovisiona un tenant raíz (`pending`/`unverified`) y su membership owner.    |
| 04-02 | `POST /admin/tenants/{tenantId}/verification`                            | `SECURITY_ADMIN`                    | Verifica y activa el tenant (`pending→active`, `unverified→verified`).        |
| 04-03 | `POST /tenants/{tenantId}/child-tenants`                                 | `SECURITY_ADMIN`                    | Crea un sub-tenant hijo (`parent_tenant_id`) con membership admin inicial.    |
| 04-04 | `POST /tenants/{tenantId}/branches`                                      | Owner/admin del tenant o plataforma | Crea una branch/sede activa con geolocalización opcional.                     |
| 04-05 | `POST /tenants/{tenantId}/memberships`                                   | Owner/admin del tenant o plataforma | Incorpora un usuario al tenant: la membresía nace **pendiente de aceptación**. |
| 04-06 | `POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments` | Owner/admin del tenant o plataforma | Asigna la membresía a una branch del tenant; fija `primary` si es la primera. |
| 04-07 | `POST /tenants/{tenantId}/memberships/{membershipId}/transfer`           | Owner/admin del tenant o plataforma | Transfiere entre branches (cierra origen, abre destino, mueve `primary`).     |
| 04-08 | `PATCH /tenants/{tenantId}/memberships/{membershipId}/role`              | Owner/admin; OWNER para ownership   | Cambia rol y/o scope de la membresía.                                         |
| 04-09 | `POST /tenants/{tenantId}/memberships/{membershipId}/offboard`           | Owner/admin; OWNER para ownership   | Da de baja la membresía y cierra en cascada sus asignaciones a branch.        |
| 04-10 | `POST /admin/tenants/{tenantId}/suspend`                                 | `SUPERADMIN`                        | Suspende el tenant y cascadea a branches y memberships activos.               |
| —     | `GET /tenants/me/membership-invitations`                                 | Sesión (`@TenantAgnostic`)          | Mis membresías pendientes de aceptar, con el nombre de la organización.       |
| —     | `POST /tenants/me/membership-invitations/{membershipId}/accept`          | Sesión (`@TenantAgnostic`)          | La persona acepta una membresía pendiente propia: pasa a `active`.            |
| —     | `POST /tenants/me/membership-invitations/{membershipId}/decline`         | Sesión (`@TenantAgnostic`)          | La persona la rechaza: queda `ended` y nunca contó.                           |

## Entidades

`directory.tenants`, `directory.branches`, `directory.tenant_memberships`,
`directory.branch_memberships` (más `tenant_affiliation_documents`,
`tenant_legal_representatives`, `tenant_web_configs`, no expuestas por estos UCs).

## Reglas de negocio

- `code` de tenant es único global; `code` de branch es único por tenant.
- Verificación solo desde `pending`; creación de branch/child/membership exige
  tenant `active`; asignación/transferencia/rol/offboard exigen membresía `active` o, para preparar o retirar una
  invitación, pendiente de aceptación.
- Una branch usada en asignación/transferencia debe pertenecer al mismo tenant.
- No se permite más de una membresía activa por (usuario, tenant), ni una segunda invitación mientras hay una pendiente.
- **Consentimiento**: la membresía que crea un administrador (`04-05`) queda en `directory:MEMBERSHIP_PENDING_ACCEPTANCE`
  hasta que la persona la acepte. Una pendiente **no cuenta** para el token (`tenants`), las políticas de sesión, la lectura
  de la organización ni los vínculos de apoyo. Canjear un QR o una invitación de afiliación es el consentimiento y activa
  al instante. Aceptar y rechazar solo operan sobre membresías **propias** en ese estado; ajena, inexistente, ya decidida
  o pendiente de aprobación de la organización (`MEMBERSHIP_INVITED`, que es lo contrario: la persona pidió entrar) responden
  404 igual. Sin esta regla un administrador podía añadir a cualquier cuenta y, con una política de sesión, cerrarle el
  acceso en sus demás organizaciones.
- **Origen de la membresía** (`tenant_memberships.origin_concept_id`, modelo v4.2.71, anulable, FK al catálogo): por qué
  existe la fila. Lo escribe quien la crea y solo la API lo cambia después. Conceptos `directory:MEMBERSHIP_ORIGIN_*`
  (`DIR.MEMBERSHIP_ORIGIN_*`):

  | Origen                 | Quién lo escribe                                                                                                             |
  | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
  | `OWNER_CREATED`        | alta de la organización: el dueño (`provision`, `POST /iam/auth/register-organization`)                                       |
  | `ADMIN_ADDED`          | un administrador (`04-05`; el administrador de una organización hija; quien aprueba el vínculo de un médico, `ensureCareMembership`) |
  | `INVITATION_REDEEMED`  | la persona canjeó la invitación o el QR de un doctor (`delegated_access`)                                                    |
  | `SUPPORT_ENGAGEMENT`   | existe solo por un vínculo de apoyo: solicitud aprobada, invitación o QR de apoyo (`delegated_access`)                       |
  | `UNKNOWN`              | declarado desconocido: la membresía por defecto del autorregistro de paciente y de profesional, y las de los seeds           |

  Las filas anteriores a v4.2.71 quedan en `NULL` (sin backfill) y se tratan igual que `UNKNOWN`. Conceder un vínculo de
  apoyo a quien ya es miembro **no** cambia su origen; solo en el otro sentido se corrige: si una membresía `SUPPORT_ENGAGEMENT`
  recibe después al profesional (canje de un QR de doctor o aprobación de su vínculo) pasa a `INVITATION_REDEEMED` /
  `ADMIN_ADDED`, porque ya no depende del vínculo. `TenantMembershipsRepository.isSupportOnly` decide por el origen exacto:
  `SUPPORT_ENGAGEMENT` es solo apoyo (salvo que ya tenga una asignación activa que no nace de una plantilla de apoyo); cualquier
  otro origen declarado, no (el QR de un doctor abre una membresía de personal, no «solo apoyo»); con origen `NULL` o `UNKNOWN`
  se conserva la regla anterior (vínculos con plantilla y ninguna otra asignación). El origen se publica como el conjunto de
  valores `membership-origin` (selector del catálogo de enumeraciones).
- Suspensión y offboarding son en cascada dentro de una única transacción.

## Conceptos

Definidos en [`directory.concepts.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/directory/directory.concepts.ts) vía
`defineModuleConcepts('directory', {...})`, exportando `DIRECTORY_CONCEPT_SEEDS` y
el mapa `DIR`. Los estados `active`/`verified` de tenant y los tipos de tenant /
entidad legal reutilizan conceptos transversales (`CONCEPTS.*`).

## Permisos, logs y errores

- Guard global de auth; administración interna decidida por membresía activa de
  tenant y plataformas; el ownership exige OWNER.
- Logs Pino estructurados por operación (`directory.*`), sin secretos ni PHI.
- Varias denegaciones no llevan `reason` estable.

## Tests

- `corepack yarn test src/modules/directory --runInBand --silent`: 14 suites y
  192 pruebas aprobadas durante la revisión.
- Smoke transversal: `test/smoke/modules/directory.smoke.ts` (`DIRECTORY_SMOKE`).
