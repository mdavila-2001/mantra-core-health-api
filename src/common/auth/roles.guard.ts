import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';
import type { AuthenticatedUser } from './authenticated-user.interface';

/**
 * Autorización basada en roles globales. Se ejecuta después del `JwtAuthGuard`,
 * de modo que puede asumir que `request.user` existe cuando hay roles exigidos.
 * Si el handler no declara `@Roles(...)`, no impone restricción adicional.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param reflector - Valor de reflector requerido por la operación.
   */
  constructor(private readonly reflector: Reflector) {}

  /**
   * Obtiene can activate.
   *
   * @param context - Valor de context requerido por la operación.
   * @returns Resultado de can activate conforme al contrato `boolean`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      Request & {
        /**
         * Valor de user mantenido por la instancia.
         */
        user?: AuthenticatedUser;
      }
    >();
    const roles = request.user?.roles ?? [];

    // SUPERADMIN es un comodín deliberado: evita tener que enumerar cada rol en
    // cada endpoint administrativo y concentra el privilegio total en un rol.
    if (roles.includes('SUPERADMIN')) {
      return true;
    }
    if (!required.some((role) => roles.includes(role))) {
      throw new ForbiddenException('Rol insuficiente para la operación');
    }
    return true;
  }
}
