# authz · services

Servicios de dominio. Cada uno inyecta `EntityManager` (de `@mikro-orm/postgresql`)
y usa `em.transactional` para escrituras (con `flush` padre-antes-de-hijo) y
`em.fork` para lecturas. Traducen los códigos legibles de los DTO a los
`*_concept_id` deterministas de `AUTHZ.*` / `CONCEPTS.*`.

| Servicio | UCs | Notas |
|---|---|---|
| `AuthzCatalogService` | 06-01 | Catálogo global de categorías y permisos; `code` único (409). |
| `AuthzPoliciesService` | 06-02 | Política ABAC; prioridad única por (tenant, target); deny gana. |
| `AuthzRolesService` | 06-03, 06-08 | Rol + herencia; set de permisos (deny prevalece); enmascaramiento de campos (check `canWrite ⇒ canRead`). |
| `AuthzGrantsService` | 06-04, 06-05, 06-09 | Asignación de rol, excepción de permiso, grant polimórfico. |
| `AuthzClinicalService` | 06-06, 06-07, 06-10 | Acceso clínico con purpose-of-use, break-the-glass, revocar/expirar. |
| `AuthzPdpService` | 06-11, 06-12 | Invalidación de cache (clave lógica) y evaluación real deny-overrides con herencia y masking. |

## Evaluación del PDP (UC-06-12)

`AuthzPdpService.evaluate` es una evaluación **real** (no stub) de solo lectura:

1. Resuelve el permiso por `(resource, action)`.
2. Roles efectivos del usuario = asignaciones activas y vigentes + ancestros por `parent_role_id`.
3. `role_permissions` de esos roles para el permiso (allow/deny).
4. `user_permission_grants` vigentes (deny individual prevalece).
5. `access_policies` del tenant por prioridad (deny gana).
6. `resource_scope_grants` del sujeto sobre el recurso; y acceso clínico vigente por paciente.
7. `field_permissions` de los roles → campos a enmascarar en la respuesta.

Resolución final **deny-overrides**: cualquier deny → `DENY`; si no, algún allow → `PERMIT`;
en ausencia de señales, `DENY` por defecto. Devuelve `cacheKey` idempotente y `ttlSeconds`.
