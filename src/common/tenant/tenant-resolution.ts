import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { listTenantScopeDeclarations } from './tenant-scope';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';

/**
 * Roles cuyo alcance es la plataforma entera, no un tenant: operan sin cabecera
 * y no quedan atados a ninguna membresía (MCH-001).
 */
export const PRIVILEGED_TENANT_ROLES = new Set(['SUPERADMIN', 'SYSTEM']);

/** Si el actor tiene algún rol de alcance plataforma. */
export function hasPrivilegedTenantRole(user: AuthenticatedUser): boolean {
  return user.roles?.some((role) => PRIVILEGED_TENANT_ROLES.has(role)) ?? false;
}

/**
 * Resuelve el tenant activo del request para un actor ordinario.
 *
 * Extraído de `TenantContextInterceptor` para que `TenantScopeGuard` pueda
 * resolver el mismo tenant *antes* de que `RolesGuard` autorice (MCH-001): un
 * rol con ámbito de tenant sólo se puede comparar contra un tenant ya resuelto,
 * y antes ese cómputo vivía en un interceptor, que corre después de los guards.
 *
 * @throws ForbiddenException si el tenant declarado no es una membresía del
 *   actor, o si no hay forma de resolver uno sin ambigüedad.
 */
export function resolveOrdinaryTenantId(
  request: Request,
  user: AuthenticatedUser,
): string {
  const header = request.headers['x-tenant-id'];
  const declared = Array.isArray(header) ? header[0] : header;
  const memberships = user.tenantIds ?? [];

  if (declared) {
    if (!memberships.includes(declared)) {
      throw new ForbiddenException(
        'El actor no pertenece al tenant indicado en X-Tenant-Id',
      );
    }
    return declared;
  }

  if (memberships.length === 1) {
    return memberships[0];
  }

  throw new ForbiddenException(
    memberships.length === 0
      ? 'El actor no pertenece a ningún tenant: indique X-Tenant-Id.'
      : 'El actor pertenece a varios tenants: indique cuál en X-Tenant-Id.',
  );
}

/**
 * Resuelve el tenant propietario que declara un request privilegiado
 * (`SUPERADMIN`/`SYSTEM`), sin exigir membresía: opera entre tenants.
 *
 * @returns El tenant declarado en cabecera/ruta/cuerpo/query, o `undefined`
 *   si el request no declara ninguno (barrido de sistema).
 * @throws ForbiddenException si declara más de uno distinto.
 */
export function resolvePrivilegedTenantId(
  request: Request,
): string | undefined {
  const header = request.headers['x-tenant-id'];
  const headerValue = Array.isArray(header) ? header[0] : header;
  const declarations = [
    ...(headerValue ? [{ field: 'X-Tenant-Id', declared: headerValue }] : []),
    ...listTenantScopeDeclarations(request.params),
    ...listTenantScopeDeclarations(request.body),
    ...listTenantScopeDeclarations(request.query),
  ];
  const distinct = [...new Set(declarations.map(({ declared }) => declared))];
  if (distinct.length > 1) {
    throw new ForbiddenException(
      'La solicitud privilegiada declara tenants propietarios contradictorios',
    );
  }
  return distinct[0];
}

/**
 * Resuelve el tenant activo del request, sea cual sea el tipo de actor.
 *
 * @returns El tenant resuelto, o `undefined` para un barrido de sistema
 *   (actor privilegiado sin tenant declarado).
 */
export function resolveRequestTenantId(
  request: Request,
  user: AuthenticatedUser,
): string | undefined {
  if (hasPrivilegedTenantRole(user)) {
    return resolvePrivilegedTenantId(request);
  }
  return resolveOrdinaryTenantId(request, user);
}
