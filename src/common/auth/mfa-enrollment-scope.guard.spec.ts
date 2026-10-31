import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { MfaEnrollmentScopeGuard } from './mfa-enrollment-scope.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

/** Contexto HTTP mínimo con la plantilla de ruta que Express deja en `request.route`. */
function ctx(
  request: Record<string, unknown>,
  opts: { isPublic?: boolean; type?: string } = {},
): ExecutionContext {
  const handler = () => undefined;
  if (opts.isPublic) Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);
  class Controller {}
  return {
    getType: () => opts.type ?? 'http',
    getHandler: () => handler,
    getClass: () => Controller,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

const limited = { user: { id: 'u1', mfaEnrollment: true } };
const full = { user: { id: 'u1', mfaEnrollment: false } };

describe('MfaEnrollmentScopeGuard (N6: el token de alcance limitado)', () => {
  const guard = new MfaEnrollmentScopeGuard(new Reflector());
  const call = (
    req: Record<string, unknown>,
    path: string,
    method = 'GET',
    opts: { isPublic?: boolean; type?: string } = {},
  ) => guard.canActivate(ctx({ ...req, method, route: { path }, path }, opts));

  it('un token completo pasa por cualquier ruta', () => {
    expect(call(full, '/clinical/encounters')).toBe(true);
    expect(call({}, '/clinical/encounters')).toBe(true);
  });

  it.each([
    ['GET', '/iam/me/mfa'],
    ['POST', '/iam/me/mfa/totp'],
    ['POST', '/iam/me/mfa/totp/:factorId/confirm'],
    ['POST', '/iam/me/mfa/:factorId/revoke'],
    ['POST', '/iam/auth/logout'],
    ['POST', '/iam/auth/token/refresh'],
    ['POST', '/iam/auth/refresh'],
    ['GET', '/iam/me'],
  ])('el limitado SÍ puede %s %s', (method, path) => {
    expect(call(limited, path, method)).toBe(true);
  });

  it.each([
    ['GET', '/clinical/encounters'],
    ['GET', '/tenants/me'],
    ['POST', '/iam/auth/logout-all'],
    ['GET', '/iam/me/sessions'],
    ['POST', '/iam/me/devices/:id/confirm'],
    ['POST', '/iam/auth/change-password'],
    ['PUT', '/org/session-policies'],
    ['GET', '/iam/me/network'],
    // Solo GET /iam/me: la propia cuenta, no escribirla.
    ['POST', '/iam/me'],
    // Prefijos parecidos que no son /iam/me/mfa*.
    ['GET', '/iam/me/mfa-otro'],
    ['GET', '/iam/users/:id/mfa-factors'],
  ])(
    'el limitado NO puede %s %s: 403 MFA_ENROLLMENT_REQUIRED',
    (method, path) => {
      let error: unknown;
      try {
        call(limited, path, method);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        reason: 'MFA_ENROLLMENT_REQUIRED',
      });
    },
  );

  it('se decide por la plantilla de la ruta, no por la URL cruda: una URL con .. no abre nada', () => {
    expect(() =>
      guard.canActivate(
        ctx({
          ...limited,
          method: 'GET',
          route: { path: '/clinical/encounters' },
          path: '/iam/me/mfa/../../clinical/encounters',
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('sin plantilla de ruta cae a la ruta pedida', () => {
    expect(
      guard.canActivate(
        ctx({ ...limited, method: 'GET', path: '/iam/me/mfa' }),
      ),
    ).toBe(true);
    expect(() =>
      guard.canActivate(
        ctx({ ...limited, method: 'GET', path: '/clinical/encounters' }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('las rutas @Public y los transportes no HTTP no se tocan', () => {
    expect(call(limited, '/clinical/x', 'GET', { isPublic: true })).toBe(true);
    expect(call(limited, '/clinical/x', 'GET', { type: 'ws' })).toBe(true);
  });
});
