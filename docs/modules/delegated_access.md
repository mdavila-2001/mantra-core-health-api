<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/delegated_access/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver README.md de la raíz, tabla "Arquitectura y mapa").
-->

# Módulo `delegated_access`

**Fuente:** [`src/modules/delegated_access/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/delegated_access/README.md)
· 9 controllers · 8 services · 10 repositories · 9 entidades · 14 DTO

---

# Módulo 29 — Delegated Access and Scoped Infrastructure Users

Delegación scoped de acceso: usuarios de organización con alcance y vigencia, sets
de permisos delegados versionados, delegaciones de practitioner, solicitudes con
aprobación previa, grants temporales por propósito, revocación en cascada, barrido
de expiración y evaluación del actor efectivo (con step-up). Sin impersonación:
delegante y delegado quedan siempre auditados en `delegation_events`.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/delegated_access -name '*.controller.ts' | wc -l
  find src/modules/delegated_access -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/delegated_access -name '*.entity.ts' | wc -l
  find src/modules/delegated_access -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **7 controllers, 31 rutas HTTP, 7 entidades y 6 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 7 de 7 archivos `*.entity.ts`): `delegated_access_approval_requests`, `delegated_access_grants`, `delegated_permission_set_items`, `delegated_permission_sets`, `delegation_events`, `organization_user_assignments`, `practitioner_delegate_assignments`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /access-requests/:id/decision` | SECURITY_ADMIN | `access-requests` |
| `POST /delegated-access/expiry-sweep` | SYSTEM, SECURITY_ADMIN | `delegated-access-authz` |
| `POST /authz/effective-actor/evaluate` | SECURITY_ADMIN | `delegated-access-authz` |
| `GET /delegated-permission-sets` | SECURITY_ADMIN | `delegated-permission-sets` |
| `POST /delegated-permission-sets` | SECURITY_ADMIN | `delegated-permission-sets` |
| `POST /delegated-permission-sets/:id/versions` | SECURITY_ADMIN | `delegated-permission-sets` |
| `POST /org/:tenantMembershipId/user-assignments` | SECURITY_ADMIN | `org-user-assignments` |
| `PATCH /org/user-assignments/:id` | SECURITY_ADMIN | `org-user-assignments` |
| `POST /practitioner-delegates` | SECURITY_ADMIN | `practitioner-delegates` |
| `POST /practitioner-delegates/:id/access-requests` | SECURITY_ADMIN | `practitioner-delegates` |
| `POST /practitioner-delegates/:id/grants` | SECURITY_ADMIN | `practitioner-delegates` |
| `POST /practitioner-delegates/:id/revoke` | SECURITY_ADMIN | `practitioner-delegates` |
| `GET /me/support-engagements` | SUPPORT_STAFF (sin tenant) | `support-staff` |
| `GET /me/support-access` | SUPPORT_STAFF (sin tenant) | `support-staff` |
| `GET /me/support-catalog` | SUPPORT_STAFF (sin tenant) | `support-staff` |
| `POST /support-engagement-requests` | SUPPORT_STAFF (sin tenant) | `support-staff` |
| `POST /me/support-engagements/:id/confirm` | SUPPORT_STAFF (sin tenant) | `support-staff` |
| `POST /me/support-engagements/:id/decline` | SUPPORT_STAFF (sin tenant) | `support-staff` |
| `POST /me/support-engagements/:id/leave` | SUPPORT_STAFF (sin tenant) | `support-staff` |
| `GET /me/support-agenda` | SUPPORT_STAFF (sin tenant) | `support-staff` |
| `GET /org/support-catalog` | sesión (OWNER/ADMIN del tenant, en el servicio) | `support-staff` |
| `GET /org/support-engagement-requests` | sesión (OWNER/ADMIN del tenant, en el servicio) | `support-staff` |
| `POST /org/support-engagement-requests/:id/decision` | sesión (OWNER/ADMIN del tenant, en el servicio) | `support-staff` |
| `GET /org/support-engagements` | sesión (OWNER/ADMIN del tenant, en el servicio) | `support-staff` |
| `POST /org/support-engagements/:id/end` | sesión (OWNER/ADMIN del tenant, en el servicio) | `support-staff` |
| `POST /org/team/invitations` | sesión (OWNER/ADMIN del tenant, en el servicio) | `support-staff` |
| `GET /me/practitioner/support-team` | PRACTITIONER, CLINICIAN (sin tenant) | `practitioner-support` |
| `POST /practitioner-delegates/:id/accept` | PRACTITIONER, CLINICIAN (sin tenant) | `practitioner-support` |
| `POST /practitioner-delegates/:id/reject` | PRACTITIONER, CLINICIAN (sin tenant) | `practitioner-support` |
| `POST /me/practitioner/support-team/:id/end` | PRACTITIONER, CLINICIAN (sin tenant) | `practitioner-support` |
| `POST /me/practitioner/support-invitations` | PRACTITIONER, CLINICIAN (sin tenant) | `practitioner-support` |

## Secretarias (personal de apoyo hospitalario)

La secretaria se da de alta con `POST /iam/auth/register-support-staff` (módulo `iam`; rol global
`SUPPORT_STAFF`, perfil `profiles.secretary_profiles`). El acceso sale de **vínculos**, cada uno en
la tabla que ya lo modelaba:

- con un lugar (hospital, sede, servicio o piso): `organization_user_assignments` con rol
  `DA_ASSIGN_SECRETARY` y la columna más específica (`practice_site_id`, `clinical_unit_id`,
  `care_space_id`; ninguna = el hospital entero);
- con un doctor: `practice.practitioner_support_assignments` sobre su vinculación
  (`practitioner_role_assignment_id`).

Quién lo inició se guarda al crearlo en `initiated_by_party_concept_id` (`DA_INITIATOR_*`, parche
`database/SQL/patches/2026-10-31_secretaria_iniciador_vinculos.sql`): `ORGANIZATION` sólo lo escribe
la invitación del hospital después de comprobar que quien invita lo administra; sin iniciador, el
vínculo no lo decide nadie ni abre nada. Todo vínculo nace `PENDING` y lo decide **la otra parte**
(`domain/support-links.ts`): lo que pide
la secretaria lo acepta el hospital (OWNER/ADMIN) o, si es con un doctor, el doctor o el hospital;
lo que ofrecen el hospital o el doctor lo acepta ella. Sólo cuando el hospital la aprobó
(`grantsOrganizationAccess`: su administración aceptó lo que ella pidió, o ella aceptó lo que el
hospital ofreció; un doctor nunca, ni para un piso), su membresía del
tenant (`DIR_ROLE_SUPPORT`, creada `INVITED` con el pedido) pasa a `ACTIVE` y el hospital entra a
su token. Un vínculo que sólo aceptó el doctor no abre la membresía: da la agenda de ese doctor y
nada más del hospital (`organizationAccess: false` en `GET /me/support-access`); esa membresía no lee la estructura completa del hospital
(`TenantAdministrationService.assertCanRead`). Lo que ve —hospitales, sedes, servicios, pisos y
doctores— es `GET /me/support-access`, armado sólo con vínculos `ACTIVE`; la agenda de un doctor
(`GET /me/support-agenda`) exige un vínculo activo con ese doctor en ese hospital. Al terminar el
último vínculo vivo de un hospital, la membresía de apoyo se cierra. Los motivos y mensajes de los
cuerpos no se guardan: las tablas no tienen columna para ellos.

## Endpoints (UC → ruta)

| UC | Método y ruta | Descripción | Permiso |
|----|---------------|-------------|---------|
| UC-29-01 | `POST /org/{tenant_membership_id}/user-assignments` | Asignar usuario de organización (scoped, vigente) | `SECURITY_ADMIN` |
| UC-29-02 | `POST /delegated-permission-sets` | Publicar set de permisos delegados (v1) | `SECURITY_ADMIN` |
| UC-29-02 | `POST /delegated-permission-sets/{id}/versions` | Versionar set (reemplazo all-or-nothing) | `SECURITY_ADMIN` |
| UC-29-03 | `POST /practitioner-delegates` | Crear delegación de practitioner | `SECURITY_ADMIN` |
| UC-29-04 | `POST /practitioner-delegates/{id}/access-requests` | Solicitar acceso delegado (aprobación previa) | `SECURITY_ADMIN` |
| UC-29-05 | `POST /access-requests/{id}/decision` | Aprobar/Denegar y emitir grant scoped | `SECURITY_ADMIN` |
| UC-29-06 | `POST /practitioner-delegates/{id}/grants` | Grant pre-autorizado por-propósito y temporal | `SECURITY_ADMIN` |
| UC-29-07 | `POST /practitioner-delegates/{id}/revoke` | Revocar delegación inmediata (cascada) | `SECURITY_ADMIN` |
| UC-29-08 | `POST /delegated-access/expiry-sweep` | Expirar delegaciones y grants vencidos | `SECURITY_ADMIN` |
| UC-29-09 | `POST /authz/effective-actor/evaluate` | Evaluar actor efectivo por propósito (step-up) | `SECURITY_ADMIN` |
| UC-29-10 | `PATCH /org/user-assignments/{id}` | Reasignar supervisor / suspender (cascada) | `SECURITY_ADMIN` |

## Entidades (esquema `delegated_access`)

`organization_user_assignments`, `delegated_permission_sets`,
`delegated_permission_set_items`, `practitioner_delegate_assignments`,
`delegated_access_approval_requests`, `delegated_access_grants`, `delegation_events`.

## Reglas de negocio

- Escrituras en `em.transactional`; las FK son columnas uuid planas, por lo que se
  hace `flush` del padre antes de los hijos.
- `may_sign_clinical_content` nunca se delega por este flujo (queda `false`).
- Grants con `valid_to` obligatorio (alcance temporal); expiran por barrido.
- Solicitud: unicidad de pendiente por (delegación, permiso, paciente/encuentro).
- `PATCH` con `expectedRowVersion` → concurrencia optimista (409 si no coincide);
  suspender cascada a las delegaciones dependientes.
- Revocación idempotente si ya está `REVOKED`; cascada a grants y solicitudes.
- Alcance por tenant (`DelegationScopeService`): el tenant sale de `requireTenantId()` y el
  `tenantId` del cuerpo sólo se contrasta (403 `DELEGATED_TENANT_SCOPE_REQUIRED`). La delegación
  no tiene `tenant_id`: su tenant es el de su set. Crear una delegación exige que la asignación de
  organización (por su membresía), la asignación de rol del profesional (por su práctica) y el set
  sean del tenant activo; emitir un grant exige además que el encuentro sea del tenant y del
  paciente indicado. Un eslabón ajeno responde igual que uno inexistente (404, mismo mensaje y
  `reason`, sin `details`).
- `POST /authz/effective-actor/evaluate` evalúa al usuario autenticado, o al declarado en
  `effectiveUserId`; sólo el titular de la asignación del delegado (en el tenant activo) puede
  recibir `allowed: true`, cualquier otro recibe `DELEGATED_SUBJECT_MISMATCH`.

## Conceptos

Declarados en `delegated_access.concepts.ts` (`DELEGATED_ACCESS_CONCEPT_SEEDS`,
mapa `DELEG`). Los estados de agregado reutilizan `CONCEPTS.STATE_*`; el resto
(roles de asignación, scopes, tipos de delegado/grant, propósitos, eventos y
motivos) son propios del módulo.

## Logs

Pino estructurado por operación (`delegated_access.*`), con inicio, éxito y
rechazos de regla de negocio. Nunca se registran secretos ni PHI.

## Tests

- Unit: `services/*.service.spec.ts` (mockean repos/`EntityManager`) y
  `controllers/*.controller.spec.ts` (mockean servicios).
- Smoke transversal: `test/smoke/modules/delegated_access.smoke.ts`
  (`DELEGATED_ACCESS_SMOKE`).
