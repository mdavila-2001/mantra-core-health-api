# src / common / tenant

Agrupa los componentes relacionados con **tenant** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `tenant-context.interceptor.spec.ts` | Pruebas unitarias del componente homónimo. |
| `tenant-context.interceptor.ts` | Implementación o recurso de soporte de esta carpeta. |
| `tenant-context.ts` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

## Alcance de plataforma (`@PlatformScopeOptional`)

`platform-scope.ts` define `PLATFORM_SCOPE_ROLES` (`SUPERADMIN`, `PLATFORM_ADMIN`,
`DATA_PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`) y el marcador `@PlatformScopeOptional()` para rutas
de sólo lectura de plataforma (hoy `/admin/ops/*`). En una ruta marcada, un rol de plataforma
**global** (no presente en `scopedRoles`) sin `X-Tenant-Id` opera con alcance plataforma, aunque
tenga 2+ membresías. Con cabecera rige la resolución ordinaria: debe ser una membresía (403
`TENANT_MEMBERSHIP_REQUIRED` si no). No amplía `PRIVILEGED_TENANT_ROLES`; el `@Roles` de la ruta
sigue decidiendo quién lee (p. ej. `DATA_PLATFORM_ADMIN` no está en `OPS_READ_ROLES`).
