import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from './authenticated-user.interface';

/**
 * Si un rol del actor lo autoriza en el tenant resuelto (MCH-001).
 *
 * Es la regla de {@link RolesGuard}, expuesta para los guards de dominio que
 * combinan un rol con otra condición (una membresía, por ejemplo) y no deben
 * reescribirla: un código presente en `scopedRoles` sólo vale en el tenant que
 * lo indexa; uno que no aparece en ningún tenant es una excepción global.
 *
 * No aplica el comodín `SUPERADMIN`: eso lo decide quien llama.
 *
 * @param user - Sujeto autenticado (puede faltar).
 * @param role - Código de rol exigido.
 * @param tenantId - Tenant resuelto del request.
 * @returns `true` si el rol autoriza en ese tenant.
 */
export function roleAuthorizesInTenant(
  user: AuthenticatedUser | undefined,
  role: string,
  tenantId: string | undefined,
): boolean {
  if (!(user?.roles ?? []).includes(role)) return false;
  const scoped = user?.scopedRoles;
  const tenantsWithRole = scoped
    ? Object.entries(scoped)
        .filter(([, codes]) => codes.includes(role))
        .map(([tid]) => tid)
    : [];
  // No aparece en scopedRoles: excepción global, autoriza siempre.
  if (tenantsWithRole.length === 0) return true;
  // Aparece con ámbito: sólo autoriza si el tenant resuelto es uno de ellos.
  return tenantId !== undefined && tenantsWithRole.includes(tenantId);
}

/**
 * Exige que el actor tenga uno de los roles declarados con `@Roles(...)`.
 *
 * Un código de `roles` que además aparece en `scopedRoles` (MCH-001) sólo
 * autoriza dentro del tenant donde fue concedido — `TenantScopeGuard`, que
 * corre antes en la cadena, ya dejó ese tenant resuelto en el request. Un
 * código que no aparece en ningún tenant de `scopedRoles` es una excepción
 * global (rol de plataforma o asignación de negocio sin tenant declarado) y
 * sigue autorizando en cualquiera, como siempre.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Una ruta `@Public()` nunca pasa por `JwtAuthGuard`, así que no hay
    // `request.user` que evaluar. Si además declarara `@Roles(...)` por error,
    // sin este corte se vería un 403 "Rol insuficiente" que esconde el problema
    // real (ruta mal anotada) en vez de señalarlo.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const roles = request.user?.roles ?? [];

    // SUPERADMIN es un comodín deliberado: evita tener que enumerar cada rol en
    // cada endpoint administrativo y concentra el privilegio total en un rol.
    if (roles.includes('SUPERADMIN')) {
      return true;
    }

    const tenantId = request.resolvedTenantId;
    const authorizes = (role: string): boolean =>
      roleAuthorizesInTenant(request.user, role, tenantId);

    if (!required.some(authorizes)) {
      throw new ForbiddenException('Rol insuficiente para la operación');
    }
    return true;
  }
}
