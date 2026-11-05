/**
 * Autorización de AloVida Insights (`/marketing/insights/*`), decisión D-7.
 *
 * Insights es un dataset de **plataforma**: las tablas `marketing.insights_*` no
 * llevan `tenant_id`. La autoridad es el rol, no la fila.
 *
 * - `MARKETING_MANAGER` está sembrado con ámbito de TENANT: autoriza solo en el
 *   tenant donde se le concedió, así que necesita `X-Tenant-Id` (o una única
 *   membresía). El dato que recibe no se filtra por tenant.
 * - `PLATFORM_ADMIN` y `DATA_PLATFORM_ADMIN` son globales: operan sin cabecera
 *   gracias a `@PlatformTenantOptional`.
 * - `SUPERADMIN` es el comodín de `RolesGuard` y también salta la resolución.
 */

/** Quien puede leer Insights (`SUPERADMIN` entra por el comodín de `RolesGuard`). */
export const INSIGHTS_READ_ROLES = [
  'MARKETING_MANAGER',
  'PLATFORM_ADMIN',
  'DATA_PLATFORM_ADMIN',
] as const;

/**
 * Quien puede trabajar con las alertas, las reglas y sus propias preferencias,
 * vistas e informes. Son los mismos roles de lectura: el portal no distingue
 * entre mirar y trabajar, y lo que es «del usuario» se acota por su id, no por
 * el rol. `BUSINESS_ADMIN` queda fuera igual que en las lecturas.
 */
export const INSIGHTS_WRITE_ROLES = INSIGHTS_READ_ROLES;

/**
 * Quien puede modificar las reglas de alerta, que son COMPARTIDAS por toda la
 * plataforma. `MARKETING_MANAGER` (rol de tenant) las lee pero no las cambia.
 * `SUPERADMIN` entra por el comodín de `RolesGuard`.
 */
export const INSIGHTS_RULE_WRITE_ROLES = [
  'PLATFORM_ADMIN',
  'DATA_PLATFORM_ADMIN',
] as const;

/**
 * Roles que `TenantScopeGuard` deja operar sin tenant resuelto. Excluye a
 * propósito `MARKETING_MANAGER`: un rol con ámbito de tenant no se vuelve
 * global por estar en esta lista (solo cuenta el rol concedido como global).
 */
export const INSIGHTS_PLATFORM_ROLES = [
  'SUPERADMIN',
  'PLATFORM_ADMIN',
  'DATA_PLATFORM_ADMIN',
] as const;
