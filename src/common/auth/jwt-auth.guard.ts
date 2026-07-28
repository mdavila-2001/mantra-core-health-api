import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Guard de autenticación aplicado globalmente. Exige un JWT válido en toda ruta
 * excepto las anotadas con `@Public()`. Al ser global, un endpoint nuevo nace
 * protegido por defecto: olvidar el guard cierra el acceso, no lo abre.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param reflector - Valor de reflector requerido por la operación.
   */
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Obtiene can activate.
   *
   * @param context - Valor de context requerido por la operación.
   * @returns Resultado de can activate.
   */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
