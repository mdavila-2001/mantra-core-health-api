# src / common / tenant

Groups **tenant**-related components and keeps this system responsibility cohesive.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `tenant-context.interceptor.spec.ts` | Pruebas unitarias del componente homónimo. |
| `tenant-context.interceptor.ts` | Support implementation or resource for this folder. |
| `tenant-context.ts` | Support implementation or resource for this folder. |
| `rls-transaction.ts` | `withTenantRls` y `readWithSystemRls`: transacción propia y corta con el contexto RLS fijado, para lo que corre fuera de la transacción de la petición (guards, rutas `@TenantAgnostic`, sockets). |
| `rls-transaction.spec.ts` | Pruebas unitarias del helper de transacción RLS. |
| `rls-transaction.testing.ts` | Doble de `EntityManager` para los specs de quien usa el helper. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.

## Alcance de plataforma (`@PlatformScopeOptional`)

`platform-scope.ts` define `PLATFORM_SCOPE_ROLES` (`SUPERADMIN`, `PLATFORM_ADMIN`,
`DATA_PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`) y el marcador `@PlatformScopeOptional()` para rutas
de sólo lectura de plataforma (hoy `/admin/ops/*`). En una ruta marcada, un rol de plataforma
**global** (no presente en `scopedRoles`) sin `X-Tenant-Id` opera con alcance plataforma, aunque
tenga 2+ membresías. Con cabecera rige la resolución ordinaria: debe ser una membresía (403
`TENANT_MEMBERSHIP_REQUIRED` si no). No amplía `PRIVILEGED_TENANT_ROLES`; el `@Roles` de la ruta
sigue decidiendo quién lee (p. ej. `DATA_PLATFORM_ADMIN` no está en `OPS_READ_ROLES`).

## Transacción RLS fuera de la petición (`rls-transaction.ts`)

`TenantContextInterceptor` abre la transacción de la petición con el tenant fijado, pero los guards corren antes
que él y las rutas `@TenantAgnostic`, `@Public` y los sockets no pasan por él. Una lectura de una tabla con RLS
hecha ahí vuelve vacía. Dos funciones, una por forma:

- `withTenantRls(em, tenantId, work, { readOnly? })`: el tenant ya está verificado (por ejemplo
  `request.resolvedTenantId`, o uno validado contra el alcance del actor). Fija `system_context = 'false'` y después
  `current_tenant_id`, en ese orden, como el interceptor.
- `readWithSystemRls(em, work)`: `system_context = 'true'` abre **todos** los tenants mientras dure la transacción.
  Solo para consultas que ya filtran por el actor dentro de su propio predicado. Siempre de solo lectura
  (`START TRANSACTION READ ONLY`); no hay opción para escribir.

Ambas hacen `fork({ keepTransactionContext: false })` y envuelven con `ownedTransaction`: nunca un savepoint de la
petición, aunque el fork plano llegue a heredarla. Con `RLS_ENFORCE` distinto de `true` corren `work` en un fork,
sin transacción. El `tx` que reciben es el que tiene que usar `work`.
