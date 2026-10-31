import { SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { roleAuthorizesInTenant } from '../auth/roles.guard';
import { hasPrivilegedTenantRole } from './tenant-resolution';

/**
 * Roles de plataforma: operan la plataforma entera, no una organización.
 *
 * Sólo cuentan como **globales**: un código que el token trae también en
 * `scopedRoles` es una asignación acotada a un tenant y no da alcance
 * plataforma (misma regla que `roleAuthorizesInTenant`).
 *
 * Esto NO es `PRIVILEGED_TENANT_ROLES`: aquel conjunto además puede declarar el
 * `X-Tenant-Id` de cualquier organización. Un rol de plataforma sólo gana la
 * *ausencia* de cabecera en las rutas marcadas con {@link PlatformScopeOptional};
 * si manda cabecera, rige la membresía como para cualquier actor.
 */
export const PLATFORM_SCOPE_ROLES = [
  'SUPERADMIN',
  'PLATFORM_ADMIN',
  'DATA_PLATFORM_ADMIN',
  'GOVERNANCE_ADMIN',
] as const;

/** Clave de metadatos de {@link PlatformScopeOptional}. */
export const PLATFORM_SCOPE_OPTIONAL_KEY = 'platformScopeOptional';

/**
 * Marca rutas (de sólo lectura de plataforma) donde la ausencia de
 * `X-Tenant-Id` significa «alcance plataforma» para quien tenga un rol de
 * {@link PLATFORM_SCOPE_ROLES} global. No sustituye a `@Roles`: el rol de la
 * ruta sigue mandando.
 */
export const PlatformScopeOptional = (): ClassDecorator & MethodDecorator =>
  SetMetadata(PLATFORM_SCOPE_OPTIONAL_KEY, true);

/** Si el actor tiene algún rol de plataforma como rol global. */
export function hasPlatformScope(user: AuthenticatedUser | undefined): boolean {
  return PLATFORM_SCOPE_ROLES.some((role) =>
    roleAuthorizesInTenant(user, role, undefined),
  );
}

/**
 * Si el request debe tratarse como de alcance plataforma: ruta marcada, actor
 * con rol de plataforma global (no SUPERADMIN/SYSTEM, que ya tienen su camino) y **sin** `X-Tenant-Id`. Con cabecera, falso:
 * sigue la resolución ordinaria (membresía obligatoria).
 */
export function isPlatformScopeRequest(
  marked: unknown,
  request: Pick<Request, 'headers'>,
  user: AuthenticatedUser,
): boolean {
  if (marked !== true || !hasPlatformScope(user)) return false;
  // SUPERADMIN/SYSTEM conservan su resolución propia (tenant por ruta/cuerpo/query).
  if (hasPrivilegedTenantRole(user)) return false;
  const header = request.headers['x-tenant-id'];
  const declared = Array.isArray(header) ? header[0] : header;
  return !declared;
}
