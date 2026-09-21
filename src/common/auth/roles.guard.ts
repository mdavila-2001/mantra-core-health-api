import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { AuthenticatedRequest } from './authenticated-user.interface';

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

    const scoped = request.user?.scopedRoles;
    const tenantId = request.resolvedTenantId;
    const authorizes = (role: string): boolean => {
      if (!roles.includes(role)) return false;
      const tenantsWithRole = scoped
        ? Object.entries(scoped)
            .filter(([, codes]) => codes.includes(role))
            .map(([tid]) => tid)
        : [];
      // No aparece en scopedRoles: excepción global, autoriza siempre.
      if (tenantsWithRole.length === 0) return true;
      // Aparece con ámbito: sólo autoriza si el tenant resuelto es uno de ellos.
      return tenantId !== undefined && tenantsWithRole.includes(tenantId);
    };

    if (!required.some(authorizes)) {
      throw new ForbiddenException('Rol insuficiente para la operación');
    }
    return true;
  }
}
