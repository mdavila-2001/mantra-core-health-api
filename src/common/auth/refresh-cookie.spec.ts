import { describe, it, expect, jest } from '@jest/globals';
import {
  clearRefreshCookie,
  loadRefreshCookieConfig,
  readCookie,
  setRefreshCookie,
} from './refresh-cookie';
import { RefreshCookieMiddleware } from './refresh-cookie.middleware';

describe('loadRefreshCookieConfig', () => {
  it('viene apagada por defecto: el contrato actual no cambia sin decisión explícita', () => {
    const config = loadRefreshCookieConfig({} as NodeJS.ProcessEnv);
    expect(config.enabled).toBe(false);
  });

  it('sólo la cadena "true" enciende el flag', () => {
    expect(
      loadRefreshCookieConfig({
        AUTH_REFRESH_COOKIE_ENABLED: 'false',
      } as NodeJS.ProcessEnv).enabled,
    ).toBe(false);
    expect(
      loadRefreshCookieConfig({
        AUTH_REFRESH_COOKIE_ENABLED: '1',
      } as NodeJS.ProcessEnv).enabled,
    ).toBe(false);
    expect(
      loadRefreshCookieConfig({
        AUTH_REFRESH_COOKIE_ENABLED: 'true',
      } as NodeJS.ProcessEnv).enabled,
    ).toBe(true);
  });

  it('acota la cookie al endpoint de refresco y usa SameSite estricto', () => {
    const config = loadRefreshCookieConfig({} as NodeJS.ProcessEnv);
    expect(config.path).toBe('/iam/auth/token/refresh');
    expect(config.sameSite).toBe('strict');
  });

  it('`secure` es true salvo que se apague explícitamente', () => {
    expect(loadRefreshCookieConfig({} as NodeJS.ProcessEnv).secure).toBe(true);
    expect(
      loadRefreshCookieConfig({
        AUTH_REFRESH_COOKIE_SECURE: 'false',
      } as NodeJS.ProcessEnv).secure,
    ).toBe(false);
    // Cualquier otro valor no puede degradar una bandera de seguridad.
    expect(
      loadRefreshCookieConfig({
        AUTH_REFRESH_COOKIE_SECURE: 'no',
      } as NodeJS.ProcessEnv).secure,
    ).toBe(true);
  });

  it('rechaza un SameSite desconocido y cae en el más estricto', () => {
    expect(
      loadRefreshCookieConfig({
        AUTH_REFRESH_COOKIE_SAMESITE: 'cualquiera',
      } as NodeJS.ProcessEnv).sameSite,
    ).toBe('strict');
    expect(
      loadRefreshCookieConfig({
        AUTH_REFRESH_COOKIE_SAMESITE: 'none',
      } as NodeJS.ProcessEnv).sameSite,
    ).toBe('none');
  });
});

describe('readCookie', () => {
  const req = (cookie?: string) =>
    ({ headers: cookie ? { cookie } : {} }) as never;

  it('encuentra la cookie entre varias', () => {
    expect(readCookie(req('a=1; mch_refresh=tok3n; b=2'), 'mch_refresh')).toBe(
      'tok3n',
    );
  });

  it('no confunde un nombre que es prefijo de otro', () => {
    expect(
      readCookie(req('mch_refresh_old=viejo'), 'mch_refresh'),
    ).toBeUndefined();
  });

  it('decodifica el valor', () => {
    expect(readCookie(req('mch_refresh=a%2Bb'), 'mch_refresh')).toBe('a+b');
  });

  it('devuelve undefined sin cabecera y ante un valor mal escapado', () => {
    expect(readCookie(req(), 'mch_refresh')).toBeUndefined();
    expect(
      readCookie(req('mch_refresh=%E0%A4%A'), 'mch_refresh'),
    ).toBeUndefined();
  });
});

describe('setRefreshCookie / clearRefreshCookie', () => {
  const config = loadRefreshCookieConfig({
    AUTH_REFRESH_COOKIE_ENABLED: 'true',
    JWT_REFRESH_TTL_DAYS: '30',
  } as NodeJS.ProcessEnv);

  it('emite la cookie httpOnly con los atributos de la configuración', () => {
    const res = {
      cookie: (jest.fn as any)(),
      clearCookie: (jest.fn as any)(),
    } as never;
    setRefreshCookie(res, 'tok3n', config);
    expect((res as unknown as { cookie: any }).cookie).toHaveBeenCalledWith(
      'mch_refresh',
      'tok3n',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/iam/auth/token/refresh',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }),
    );
  });

  it('borra con los mismos atributos: si no coinciden, el navegador no la borra', () => {
    const res = {
      cookie: (jest.fn as any)(),
      clearCookie: (jest.fn as any)(),
    } as never;
    clearRefreshCookie(res, config);
    expect(
      (res as unknown as { clearCookie: any }).clearCookie,
    ).toHaveBeenCalledWith(
      'mch_refresh',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/iam/auth/token/refresh',
      }),
    );
  });
});

describe('RefreshCookieMiddleware', () => {
  const runWith = (
    env: Record<string, string>,
    req: { headers: Record<string, string>; body?: unknown },
  ) => {
    const previous = { ...process.env };
    Object.assign(process.env, env);
    try {
      const middleware = new RefreshCookieMiddleware();
      const next = (jest.fn as any)();
      middleware.use(req as never, {} as never, next);
      expect(next).toHaveBeenCalled();
      return req.body as Record<string, unknown> | undefined;
    } finally {
      process.env = previous;
    }
  };

  it('con el flag apagado no toca la petición', () => {
    const body = runWith(
      { AUTH_REFRESH_COOKIE_ENABLED: 'false' },
      { headers: { cookie: 'mch_refresh=desde-cookie' }, body: {} },
    );
    expect(body).toEqual({});
  });

  it('con el flag encendido copia la cookie al cuerpo', () => {
    const body = runWith(
      { AUTH_REFRESH_COOKIE_ENABLED: 'true' },
      { headers: { cookie: 'mch_refresh=desde-cookie' }, body: {} },
    );
    expect(body).toEqual({ refreshToken: 'desde-cookie' });
  });

  it('el cuerpo tiene prioridad: una cookie vieja no pisa el token recién recibido', () => {
    const body = runWith(
      { AUTH_REFRESH_COOKIE_ENABLED: 'true' },
      {
        headers: { cookie: 'mch_refresh=vieja' },
        body: { refreshToken: 'del-cuerpo' },
      },
    );
    expect(body).toEqual({ refreshToken: 'del-cuerpo' });
  });

  it('sin cookie deja el cuerpo como está y la validación decide', () => {
    const body = runWith(
      { AUTH_REFRESH_COOKIE_ENABLED: 'true' },
      {
        headers: {},
        body: {},
      },
    );
    expect(body).toEqual({});
  });
});
