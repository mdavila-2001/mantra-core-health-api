import type { Request } from 'express';
import { listTenantScopeDeclarations } from './tenant-scope';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { roleAuthorizesInTenant } from '../auth/roles.guard';
import { forbiddenWithReason } from '../errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../errors/system-error-reasons';

/**
 * Roles cuyo alcance es la plataforma entera, no un tenant: operan sin cabecera
 * y no quedan atados a ninguna membresía (MCH-001).
 */
export const PRIVILEGED_TENANT_ROLES = new Set(['SUPERADMIN', 'SYSTEM']);

/**
 * Si el actor tiene algún rol de alcance plataforma.
 *
 * Un código privilegiado que el token trae además en `scopedRoles` es una
 * asignación acotada a un tenant, no un rol de plataforma: no habilita el
 * barrido entre tenants ni la declaración de un tenant ajeno. Sólo cuenta el
 * que viene como excepción global (`iam.user_global_roles` o una asignación sin
 * tenant), la misma regla que aplica `roleAuthorizesInTenant`.
 */
export function hasPrivilegedTenantRole(user: AuthenticatedUser): boolean {
  return (
    user.roles?.some(
      (role) =>
        PRIVILEGED_TENANT_ROLES.has(role) &&
        roleAuthorizesInTenant(user, role, undefined),
    ) ?? false
  );
}

/**
 * Resuelve el tenant activo del request para un actor ordinario.
 *
 * Extraído de `TenantContextInterceptor` para que `TenantScopeGuard` pueda
 * resolver el mismo tenant *antes* de que `RolesGuard` autorice (MCH-001): un
 * rol con ámbito de tenant sólo se puede comparar contra un tenant ya resuelto,
 * y antes ese cómputo vivía en un interceptor, que corre después de los guards.
 *
 * @throws ForbiddenException (`TENANT_MEMBERSHIP_REQUIRED`) si el tenant declarado no es una membresía del
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
      throw forbiddenWithReason(
        'El actor no pertenece al tenant indicado en X-Tenant-Id',
        SystemErrorReason.TENANT_MEMBERSHIP_REQUIRED,
      );
    }
    return declared;
  }

  if (memberships.length === 1) {
    return memberships[0];
  }

  // El status no cambia (403); `reason` le deja al cliente distinguir «falta
  // elegir organización» de un rechazo por permisos y abrir el selector.
  // `details.reason` repite el mismo valor para los clientes que ya lo leían
  // de ahí (TX-16); el canónico es el de primer nivel.
  const reason =
    memberships.length === 0
      ? SystemErrorReason.TENANT_REQUIRED
      : SystemErrorReason.TENANT_AMBIGUOUS;
  throw forbiddenWithReason(
    memberships.length === 0
      ? 'El actor no pertenece a ningún tenant: indique X-Tenant-Id.'
      : 'El actor pertenece a varios tenants: indique cuál en X-Tenant-Id.',
    reason,
    { reason },
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
    throw forbiddenWithReason(
      'La solicitud privilegiada declara tenants propietarios contradictorios',
      SystemErrorReason.TENANT_DECLARATION_CONFLICT,
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
