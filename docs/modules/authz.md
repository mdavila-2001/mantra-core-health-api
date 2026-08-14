<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/authz/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `authz`

**Fuente:** [`src/modules/authz/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/authz/README.md)
· 7 controllers · 8 services · 14 repositories · 15 entidades · 17 DTO

---

# Módulo 06 — authz (Authorization, Purpose of Use & Field Masking)

Autorización de la plataforma: catálogo de permisos, políticas ABAC, roles con
herencia, asignaciones y excepciones por usuario, accesos clínicos con propósito
de uso, break-the-glass, enmascaramiento de campos, grants polimórficos y el PDP
(invalidación de cache + evaluación de decisiones efectivas).

## Endpoints (UC → ruta)

| UC | Método y ruta | Rol | Descripción |
|---|---|---|---|
| 06-01 | `POST /authz/permission-categories` | SECURITY_ADMIN | Define una categoría de permiso |
| 06-01 | `POST /authz/permissions` | SECURITY_ADMIN | Define un permiso del catálogo global |
| 06-02 | `POST /authz/tenants/{tenantId}/access-policies` | SECURITY_ADMIN | Política ABAC con enmascaramiento (deny gana) |
| 06-03 | `POST /authz/roles` | SECURITY_ADMIN | Compone un rol (herencia por `parentRoleId`) |
| 06-03 | `PUT /authz/roles/{roleId}/permissions` | SECURITY_ADMIN | Asigna permisos al rol (reemplaza activos; deny prevalece) |
| 06-04 | `POST /authz/users/{userId}/role-assignments` | SECURITY_ADMIN | Asigna rol con vigencia y ámbito |
| 06-05 | `POST /authz/users/{userId}/permission-grants` | SECURITY_ADMIN | Excepción de permiso por usuario |
| 06-06 | `POST /authz/patients/{patientProfileId}/clinical-access-grants` | autenticado | Acceso clínico con purpose-of-use |
| 06-07 | `POST /authz/patients/{patientProfileId}/break-the-glass` | autenticado | Anulación de emergencia (grant elevado + sesión BTG) |
| 06-08 | `PUT /authz/roles/{roleId}/field-permissions` | SECURITY_ADMIN | Enmascaramiento de campos por rol |
| 06-09 | `POST /authz/resource-scope-grants` | SECURITY_ADMIN | Grant polimórfico sujeto→recurso (REC 3.1) |
| 06-10 | `DELETE /authz/clinical-access-grants/{grantId}` | SECURITY_ADMIN | Revoca/expira un acceso clínico |
| 06-11 | `POST /authz/pdp/cache/invalidate` | SECURITY_ADMIN | Invalida la cache de decisiones del PDP |
| 06-12 | `POST /authz/decisions/evaluate` | SECURITY_ADMIN | Evalúa la decisión efectiva (PDP) |

### Enrutado de `decisions:evaluate`

La spec nombra `POST /authz/decisions:evaluate`. En Express 5 / path-to-regexp v8
el carácter `:` inicia un parámetro nombrado, por lo que **se expone en la ruta
equivalente `POST /authz/decisions/evaluate`** (documentado y elegido para evitar
ambigüedad de parseo del path).

## Entidades

`permission_categories`, `permissions`, `access_policies`, `roles`,
`role_permissions`, `user_role_assignments`, `user_permission_grants`,
`clinical_access_grants`, `break_glass_sessions`, `field_permissions`,
`resource_scope_grants` (esquema `authz`). Todas con `row_version` optimista y
FKs como columnas `uuid` planas.

## Reglas de negocio

- **Deny-overrides**: en la evaluación del PDP y en `role_permissions`, `deny`
  prevalece sobre `allow`; las excepciones de usuario `deny` prevalecen sobre el
  `allow` heredado de rol.
- **Herencia de roles**: los roles efectivos incluyen los ancestros por
  `parent_role_id`; el alta valida existencia del padre.
- **Unicidad**: `code` único en categorías/permisos/roles (409); prioridad única
  por `(tenant, target_resource)` en políticas; asignación/excepción/acceso
  activo único (409).
- **Propósito de uso**: acceso clínico exige consentimiento salvo `TREATMENT`
  directo; break-the-glass usa `EMERGENCY`, sin consentimiento y ventana corta.
- **Masking**: `field_permissions` con check `canWrite ⇒ canRead` (412 si no).
- **Vigencia**: `valid_from < valid_to`; la revocación distingue `revoked` de
  `expired` según `valid_to`.

## Roles efectivos y el claim `roles` del token

`RolesGuard` autoriza mirando **sólo** el claim `roles` del JWT. Hasta agosto de
2026 ese claim se construía únicamente con `iam.user_global_roles`, cuyo catálogo
tiene cuatro códigos (`USER`, `PATIENT`, `SECURITY_ADMIN`, `SUPERADMIN`): todo
`@Roles('CLINICIAN')`, `@Roles('SURGEON')`… era inalcanzable salvo por el comodín
`SUPERADMIN`, y los roles compuestos aquí no llegaban al guard.

Ahora `AuthzEffectiveRolesService.codesForUser` resuelve los códigos vigentes de
`authz.user_role_assignments` e `iam` los suma al claim al emitir y al refrescar
el token. Consecuencias que conviene tener presentes:

- **La vigencia se respeta.** `findActiveForUser` filtra por `valid_from`/
  `valid_to` además del estado; antes sólo por estado, así que un rol temporal
  seguía concediendo acceso indefinidamente.
- **La revocación tarda como mucho lo que dura el access token** (15 min): el
  claim se recalcula al refrescar. Para cortar antes hay que revocar la sesión.
- **`ensureRoleByCode`** concede un rol dentro de la transacción del llamador.
  Lo usan el alta administrativa de profesional (`clinicalRoles`) y la
  verificación de matrícula (concede `PRACTITIONER`).
- Los diez roles asistenciales de sistema los siembra
  `AuthzClinicalRolesSeedService` (`src/common/seed/`) desde `authz.seed.ts`;
  `GET /authz/roles` los lista con su código para poder asignarlos sin conocer
  el uuid de memoria.

## Conceptos

`src/modules/authz/authz.concepts.ts` declara los conceptos propios con
`defineModuleConcepts('authz', {...})` y exporta `AUTHZ_CONCEPT_SEEDS` (para el
seed) y `AUTHZ` (map nombre→UUID que consumen los servicios). Los estados de ciclo
de vida reutilizan `CONCEPTS.STATE_ACTIVE/REVOKED/EXPIRED` transversales.

## Logs

Pino estructurado por operación (`authz.*`), sin PHI ni secretos. Break-the-glass
se registra en nivel `warn` (acceso de emergencia).

## Tests

- Unit: `services/*.service.spec.ts` (mockean repos/EM, incluida la evaluación
  real del PDP) y `controllers/*.controller.spec.ts` (mockean el servicio).
- Smoke transversal: `test/smoke/modules/authz.smoke.ts` → `AUTHZ_SMOKE`.

