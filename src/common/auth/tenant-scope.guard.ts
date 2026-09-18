import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { IS_TENANT_AGNOSTIC_KEY } from '../tenant/tenant-agnostic.decorator';
import { resolveRequestTenantId } from '../tenant/tenant-resolution';
import type { AuthenticatedRequest } from './authenticated-user.interface';

/**
 * Resuelve el tenant activo del request y lo deja en `request.resolvedTenantId`
 * **antes** de que `RolesGuard` autorice (MCH-001).
 *
 * Hasta este guard, el único lugar que resolvía el tenant era
 * `TenantContextInterceptor`, y los interceptores de Nest corren después de
 * los guards: un rol con ámbito de tenant no tenía contra qué tenant
 * compararse en el momento en que `RolesGuard` decidía. Se registra en
 * `AuthModule` entre `JwtAuthGuard` y `RolesGuard` (mismo orden que los
 * `APP_GUARD` del módulo).
 *
 * No aplica RLS ni valida que el cuerpo/query se mantenga dentro del tenant:
 * eso lo sigue haciendo `TenantContextInterceptor`, que reutiliza el resultado
 * de este guard en vez de recalcularlo.
 */
@Injectable()
export class TenantScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const isTenantAgnostic = this.reflector.getAllAndOverride<boolean>(
      IS_TENANT_AGNOSTIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isTenantAgnostic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      // Ruta no pública sin sujeto: `JwtAuthGuard` ya la habrá rechazado. No se
      // inventa un tenant para una identidad que no existe.
      return true;
    }

    request.resolvedTenantId = resolveRequestTenantId(request, user);
    return true;
  }
}
