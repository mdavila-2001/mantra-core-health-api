import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { internalWithReason } from '../errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../errors/system-error-reasons';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from './authenticated-user.interface';

/**
 * Inyecta el `AuthenticatedUser` que `JwtStrategy` adjuntó a `request.user`.
 *
 * Si no hay usuario en la petición es un error de programación -un handler no
 * público sin el guard aplicado-, no una condición de negocio: se lanza 500 en
 * lugar de devolver `undefined` y arrastrar el fallo a la capa de servicio.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw internalWithReason(
        'CurrentUser usado en un handler sin autenticación aplicada',
        SystemErrorReason.AUTHENTICATION_NOT_APPLIED,
      );
    }
    return request.user;
  },
);
