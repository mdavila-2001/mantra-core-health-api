import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { forbiddenWithReason } from '../errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../errors/system-error-reasons';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { AuthenticatedRequest } from './authenticated-user.interface';

/**
 * Rutas que sí admite el token de alcance limitado (`mfaEnrollment: true`): el
 * alta del segundo factor, el cierre de sesión, el refresco y la lectura de la
 * propia cuenta. Se comparan contra la plantilla de la ruta (`/iam/me/mfa/totp/:factorId/confirm`),
 * no contra la URL cruda: así una URL con `..` o con mayúsculas no cambia lo que se autoriza.
 */
const ALLOWED_ROUTES: readonly { method: string; path: RegExp }[] = [
  { method: '*', path: /^\/iam\/me\/mfa(\/.*)?$/ },
  { method: 'POST', path: /^\/iam\/auth\/logout\/?$/ },
  { method: 'POST', path: /^\/iam\/auth\/(token\/)?refresh\/?$/ },
  { method: 'GET', path: /^\/iam\/me\/?$/ },
];

/**
 * Impone `mfaEnrollment`: con el token de alcance limitado —emitido a quien debe
 * dar de alta su segundo factor— solo se llega a las rutas de {@link ALLOWED_ROUTES}.
 * Todo lo demás responde 403 `MFA_ENROLLMENT_REQUIRED`.
 *
 * Es un guard global (`AuthModule`) que corre justo después de `JwtAuthGuard`,
 * antes de resolver el tenant y de comparar roles. Sin él el aviso
 * `mfaEnrollmentRequired` del login era solo una sugerencia: la sesión era
 * completa. El token limitado sale además sin roles ni organizaciones, de modo
 * que una ruta que se saltara este guard (un socket) tampoco autoriza nada.
 */
@Injectable()
export class MfaEnrollmentScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user?.mfaEnrollment) return true;

    const route = (request as { route?: { path?: unknown } }).route?.path;
    const path = typeof route === 'string' ? route : request.path;
    const method = request.method.toUpperCase();
    const allowed = ALLOWED_ROUTES.some(
      (r) => (r.method === '*' || r.method === method) && r.path.test(path),
    );
    if (allowed) return true;

    throw forbiddenWithReason(
      'Debe dar de alta su segundo factor antes de usar la aplicación',
      SystemErrorReason.MFA_ENROLLMENT_REQUIRED,
    );
  }
}
