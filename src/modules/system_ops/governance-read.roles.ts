import { PLATFORM_SCOPE_ROLES } from '../../common/tenant/platform-scope';

/**
 * Roles de lectura del gobierno de datos (matriz de roles §3.12 del frente 04 del portal).
 *
 * `SUPERADMIN` no se enumera: es comodín en `RolesGuard`. Las asignaciones de estos roles se hacen
 * sin tenant (ver `data_catalog.roles.ts`). `DATA_GOVERNANCE_ADMIN` autoriza como
 * `GOVERNANCE_ADMIN` por el alias de `common/auth/role-aliases.ts`.
 *
 * La API es la autoridad: ocultar el menú en la pantalla no protege nada.
 */

/**
 * Políticas, bitácora de cambios, registro de entidades, dominios, retenciones, cola de revisión y
 * trabajos. Es la misma lista que `PORTAL_READ_ROLES` del catálogo: quien lee el catálogo lee el
 * gobierno que lo gobierna (el `AUDITOR` y el `DATA_STEWARD` entran en sólo lectura; decisión D-2).
 */
export const GOVERNANCE_VIEW_ROLES = [
  'SECURITY_ADMIN',
  'PLATFORM_ADMIN',
  'GOVERNANCE_ADMIN',
  'DATA_PLATFORM_ADMIN',
  'DPO',
  'AUDITOR',
  'DATA_STEWARD',
] as const;

/**
 * Retenciones legales: nombran objetivos bajo litigio o requerimiento, así que no se abren al
 * custodio ni a la plataforma de datos. Gobierno, seguridad, protección de datos y auditoría.
 */
export const LEGAL_HOLD_VIEW_ROLES = [
  'SECURITY_ADMIN',
  'PLATFORM_ADMIN',
  'GOVERNANCE_ADMIN',
  'DPO',
  'AUDITOR',
] as const;

/**
 * De una lista de roles de ruta, los que NO tienen alcance plataforma por sí mismos (`DPO`,
 * `AUDITOR`, `DATA_STEWARD`, `SECURITY_ADMIN`…). Se asignan sin tenant, así que sin
 * `@PlatformTenantOptional` un `GET` sin cabecera daría 403 `TENANT_REQUIRED`. Los roles que SÍ
 * tienen alcance plataforma quedan fuera a propósito: para ellos manda `@PlatformScopeOptional()`,
 * que sólo levanta la exigencia de tenant **sin** cabecera; con `X-Tenant-Id` rige la membresía.
 */
export function rolesWithoutPlatformScope(roles: readonly string[]): string[] {
  const conAlcance = new Set<string>(PLATFORM_SCOPE_ROLES);
  return roles.filter((rol) => !conAlcance.has(rol));
}
