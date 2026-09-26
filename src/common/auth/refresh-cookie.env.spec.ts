import { describe, it, expect, jest } from '@jest/globals';
import type { Request, Response } from 'express';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  clearRefreshCookie,
  loadRefreshCookieEnv,
  readRefreshCookie,
  setRefreshCookie,
} from './refresh-cookie';

/** Respuesta mínima de Express con las dos operaciones que se usan. */
function responseStub() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response & {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
  };
}

/** TX-28: las variables `AUTH_REFRESH_COOKIE_NAME/PATH/SAMESITE` se honran. */
describe('refresh-cookie: variables de entorno (TX-28)', () => {
  it('sin declarar nada conserva el nombre, la ruta y el SameSite de siempre', () => {
    const env = loadRefreshCookieEnv({});
    expect(env.name).toBe(REFRESH_COOKIE_NAME);
    expect(env.name).toBe('redesa_refresh');
    expect(env.path).toBe(REFRESH_COOKIE_PATH);
    expect(env.sameSite).toBe('strict');
  });

  it('lee nombre, ruta y SameSite del entorno', () => {
    const env = loadRefreshCookieEnv({
      AUTH_REFRESH_COOKIE_NAME: 'mch_refresh',
      AUTH_REFRESH_COOKIE_PATH: '/api/iam/auth/token/refresh',
      AUTH_REFRESH_COOKIE_SAMESITE: 'lax',
    });
    expect(env.name).toBe('mch_refresh');
    expect(env.path).toBe('/api/iam/auth/token/refresh');
    expect(env.sameSite).toBe('lax');
  });

  it('un SameSite fuera de la lista vuelve a strict', () => {
    expect(
      loadRefreshCookieEnv({ AUTH_REFRESH_COOKIE_SAMESITE: 'cualquiera' })
        .sameSite,
    ).toBe('strict');
  });

  it('la cookie se escribe y se borra con el nombre configurado', () => {
    const env = loadRefreshCookieEnv({
      AUTH_REFRESH_COOKIE_ENABLED: 'true',
      AUTH_REFRESH_COOKIE_NAME: 'mch_refresh',
      AUTH_REFRESH_COOKIE_SAMESITE: 'lax',
    });
    const res = responseStub();
    setRefreshCookie(res, 'tok', env);
    const [name, value, options] = res.cookie.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>,
    ];
    expect(name).toBe('mch_refresh');
    expect(value).toBe('tok');
    expect(options.sameSite).toBe('lax');
    expect(options.httpOnly).toBe(true);

    clearRefreshCookie(res, env);
    expect((res.clearCookie.mock.calls[0] as unknown[])[0]).toBe('mch_refresh');
  });

  it('el refresh se lee con el nombre configurado y no con el viejo', () => {
    const req = {
      headers: { cookie: 'mch_refresh=nuevo; redesa_refresh=viejo' },
    } as unknown as Request;
    expect(readRefreshCookie(req, 'mch_refresh')).toBe('nuevo');
    expect(readRefreshCookie(req)).toBe('viejo');
  });
});
