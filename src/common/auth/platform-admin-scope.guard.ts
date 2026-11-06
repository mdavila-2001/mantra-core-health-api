import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { forbiddenWithReason } from '../errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../errors/system-error-reasons';
import type { AuthenticatedRequest } from './authenticated-user.interface';
import { roleAuthorizesInTenant } from './roles.guard';

/**
 * Exige un administrador **de plataforma**: `SECURITY_ADMIN` o `SUPERADMIN` sin
 * ámbito de organización.
 *
 * `@Roles('SECURITY_ADMIN')` solo no alcanza para las rutas que miran o mueven
 * usuarios y datos de TODA la plataforma (ciclo de vida de cuentas, «quién puede
 * qué», simulaciones): una asignación acotada a una organización (`scopedRoles`,
 * MCH-001) también pasa ese guard dentro de su tenant, y con ella un
 * administrador de una sola clínica llegaría a cuentas y accesos ajenos. El rol
 * de plataforma es el que no aparece en `scopedRoles` (misma regla que
 * {@link RolesGuard}).
 *
 * Es un cierre conservador: una versión acotada a la organización exigiría
 * además comprobar que el usuario objetivo pertenece al tenant resuelto.
 */
@Injectable()
export class PlatformAdminScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const isPlatformAdmin =
      roleAuthorizesInTenant(user, 'SUPERADMIN', undefined) ||
      roleAuthorizesInTenant(user, 'SECURITY_ADMIN', undefined);
    if (!isPlatformAdmin) {
      throw forbiddenWithReason(
        'Rol insuficiente para la operación',
        SystemErrorReason.ROLE_INSUFFICIENT,
      );
    }
    return true;
  }
}
