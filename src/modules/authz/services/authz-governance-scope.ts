import { requireTenantId, type AuthenticatedUser } from '../../../common';
import { hasOptionalPlatformTenant } from '../../../common/tenant/platform-tenant-optional.decorator';

/**
 * Roles con los que los controladores de gobierno con alcance declaran `@PlatformTenantOptional`.
 * Tienen que ser los mismos: `TenantContextInterceptor` decide con ellos si el request corre SIN
 * tenant (actor de plataforma) o dentro del tenant resuelto (actor con alcance), y el servicio
 * tiene que llegar a la misma conclusión o el filtro y el contexto se contradicen.
 */
export const GOVERNANCE_PLATFORM_ROLES = [
  'SECURITY_ADMIN',
  'SUPERADMIN',
] as const;

/**
 * Alcance de tenant de una operación de gobierno de acceso.
 *
 * - Actor de plataforma (`SECURITY_ADMIN`/`SUPERADMIN` sin ámbito de tenant en `scopedRoles`):
 *   `undefined`, sin filtro; opera sobre toda la plataforma.
 * - Actor con alcance (el rol sólo vale en uno o varios tenants): el tenant del contexto verificado.
 *   Sin tenant en el contexto falla cerrado (`requireTenantId`), nunca cae a «global».
 *
 * @param actor - Quien ejecuta la operación.
 * @returns El tenant al que acotar toda consulta y escritura, o `undefined` para plataforma.
 * @throws PreconditionFailedException si un actor con alcance no tiene tenant activo.
 */
export function resolveGovernanceScope(
  actor: AuthenticatedUser,
): string | undefined {
  return hasOptionalPlatformTenant(actor, GOVERNANCE_PLATFORM_ROLES)
    ? undefined
    : requireTenantId();
}
