import { jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import type { Socket } from 'socket.io';
import { WsJwtGuard } from './ws-jwt.guard';

/** Handshake mínimo de un socket: sólo lo que lee el guard. */
function socket(auth: Record<string, unknown> | undefined): Socket {
  return { handshake: { auth } } as unknown as Socket;
}

function build(verify: () => unknown) {
  const jwt = { verify: jest.fn(verify) };
  const sessions = {
    assertActive: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };
  const guard = new WsJwtGuard(jwt as never, sessions as never);
  return { guard, jwt, sessions };
}

/** Lo que el filtro global serializa de la excepción. */
async function rejection(promise: Promise<unknown>) {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(UnauthorizedException);
  return (error as UnauthorizedException).getResponse() as Record<
    string,
    unknown
  >;
}

describe('WsJwtGuard', () => {
  it('sin token en el handshake responde 401 con reason ACCESS_TOKEN_MISSING', async () => {
    const { guard, jwt } = build(() => ({}));

    const body = await rejection(guard.authenticate(socket({})));

    expect(body).toMatchObject({
      code: 'UNAUTHENTICATED',
      reason: 'ACCESS_TOKEN_MISSING',
    });
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it('un token en query string no cuenta: sólo handshake.auth.token', async () => {
    const { guard } = build(() => ({}));
    const client = {
      handshake: { auth: {}, query: { token: 'abc' } },
    } as unknown as Socket;

    const body = await rejection(guard.authenticate(client));

    expect(body.reason).toBe('ACCESS_TOKEN_MISSING');
  });

  it('un token que no verifica responde 401 con reason ACCESS_TOKEN_INVALID, sin filtrar la causa', async () => {
    const { guard } = build(() => {
      throw new Error('jwt expired at 2026-01-01');
    });

    const body = await rejection(guard.authenticate(socket({ token: 'x' })));

    expect(body).toMatchObject({ reason: 'ACCESS_TOKEN_INVALID' });
    expect(JSON.stringify(body)).not.toContain('2026-01-01');
  });

  it('un token que no es de acceso responde 401 con reason TOKEN_TYPE_INVALID', async () => {
    const { guard, sessions } = build(() => ({ typ: 'refresh', sub: 'u1' }));

    const body = await rejection(guard.authenticate(socket({ token: 'x' })));

    expect(body.reason).toBe('TOKEN_TYPE_INVALID');
    expect(sessions.assertActive).not.toHaveBeenCalled();
  });

  it('un access token válido pasa por la validación de sesión y devuelve al sujeto', async () => {
    const { guard, sessions } = build(() => ({
      typ: 'access',
      sub: 'u1',
      sid: 's1',
      roles: ['USER'],
    }));

    const user = await guard.authenticate(socket({ token: 'ok' }));

    expect(sessions.assertActive).toHaveBeenCalledTimes(1);
    expect(user.id).toBe('u1');
  });

  it('N6: el token de alcance limitado (alta del segundo factor) no abre un socket', async () => {
    const { guard, sessions } = build(() => ({
      typ: 'access',
      sub: 'u1',
      sid: 's1',
      roles: [],
      mfaEnrollment: true,
    }));

    const body = await rejection(
      guard.authenticate(socket({ token: 'limitado' })),
    );

    expect(body.reason).toBe('MFA_ENROLLMENT_REQUIRED');
    expect(sessions.assertActive).not.toHaveBeenCalled();
  });

  it('N2: el socket reconstruye también las organizaciones que niegan, sin darles acceso', async () => {
    const { guard } = build(() => ({
      typ: 'access',
      sub: 'u1',
      sid: 's1',
      roles: ['USER'],
      tenants: ['y'],
      deniedTenants: { x: 'OUTSIDE_ALLOWED_HOURS' },
    }));
    const user = await guard.authenticate(socket({ token: 'ok' }));
    expect(user.tenantIds).toEqual(['y']);
    expect(user.deniedTenants).toEqual({ x: 'OUTSIDE_ALLOWED_HOURS' });
    expect(user.mfaEnrollment).toBe(false);
  });
});
