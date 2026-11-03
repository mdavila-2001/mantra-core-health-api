# src / common / tenant

Groups **tenant**-related components and keeps this system responsibility cohesive.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `tenant-context.interceptor.spec.ts` | Pruebas unitarias del componente homónimo. |
| `tenant-context.interceptor.ts` | Support implementation or resource for this folder. |
| `tenant-context.ts` | Support implementation or resource for this folder. |

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
