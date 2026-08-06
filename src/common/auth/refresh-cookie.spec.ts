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

/** Petición con la cabecera `Cookie` indicada. */
function requestStub(cookie?: string): Request {
  return { headers: cookie === undefined ? {} : { cookie } } as Request;
}

describe('refresh-cookie', () => {
  describe('loadRefreshCookieEnv', () => {
    it('está apagado mientras nadie lo encienda explícitamente', () => {
      // El default importa: encenderlo cambia el contrato del cliente, así que
      // no puede ser el efecto colateral de desplegar una versión nueva.
      expect(loadRefreshCookieEnv({}).enabled).toBe(false);
      expect(
        loadRefreshCookieEnv({ AUTH_REFRESH_COOKIE_ENABLED: 'false' }).enabled,
      ).toBe(false);
      expect(
        loadRefreshCookieEnv({ AUTH_REFRESH_COOKIE_ENABLED: '1' }).enabled,
      ).toBe(false);
      expect(
        loadRefreshCookieEnv({ AUTH_REFRESH_COOKIE_ENABLED: 'true' }).enabled,
      ).toBe(true);
    });

    it('marca Secure en producción sin que haya que declararlo', () => {
      expect(loadRefreshCookieEnv({ NODE_ENV: 'production' }).secure).toBe(
        true,
      );
      expect(loadRefreshCookieEnv({ NODE_ENV: 'development' }).secure).toBe(
        false,
      );
    });

    it('la declaración explícita gana sobre el entorno', () => {
      // Hace falta para las pruebas y para un despliegue tras un proxy que
      // termina TLS; sin esta salida, una cookie `Secure` nunca vuelve por HTTP.
      expect(
        loadRefreshCookieEnv({
          NODE_ENV: 'production',
          AUTH_REFRESH_COOKIE_SECURE: 'false',
        }).secure,
      ).toBe(false);
    });

    it('la vida de la cookie sigue a la del refresh token', () => {
      expect(loadRefreshCookieEnv({ JWT_REFRESH_TTL_DAYS: '7' }).ttlDays).toBe(
        7,
      );
      expect(loadRefreshCookieEnv({}).ttlDays).toBe(30);
    });
  });

  describe('setRefreshCookie', () => {
    it('escribe la cookie httpOnly acotada a la ruta de refresco', () => {
      const res = responseStub();

      setRefreshCookie(res, 'token-en-crudo', {
        enabled: true,
        secure: true,
        ttlDays: 30,
      });

      const calls = res.cookie.mock.calls;
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual([
        REFRESH_COOKIE_NAME,
        'token-en-crudo',
        {
          httpOnly: true,
          sameSite: 'strict',
          secure: true,
          path: REFRESH_COOKIE_PATH,
          maxAge: 30 * 24 * 60 * 60 * 1000,
        },
      ]);
    });
  });

  describe('clearRefreshCookie', () => {
    it('borra con los mismos atributos con los que se creó', () => {
      const res = responseStub();

      clearRefreshCookie(res, { enabled: true, secure: false, ttlDays: 30 });

      // Con un `path` distinto el navegador crearía una cookie nueva y dejaría
      // viva la original: el cierre de sesión no borraría nada.
      const calls = res.clearCookie.mock.calls;
      const [, options] = calls[0] as [string, Record<string, unknown>];
      expect(options.path).toBe(REFRESH_COOKIE_PATH);
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe('strict');
    });
  });

  describe('readRefreshCookie', () => {
    it('devuelve el valor de la cookie entre otras', () => {
      const req = requestStub(
        `otra=1; ${REFRESH_COOKIE_NAME}=el-token; tercera=3`,
      );

      expect(readRefreshCookie(req)).toBe('el-token');
    });

    it('no confunde una cookie cuyo nombre la contiene', () => {
      const req = requestStub(`x_${REFRESH_COOKIE_NAME}=ajena`);

      expect(readRefreshCookie(req)).toBeUndefined();
    });

    it('decodifica el valor', () => {
      const req = requestStub(`${REFRESH_COOKIE_NAME}=a%2Bb%3Dc`);

      expect(readRefreshCookie(req)).toBe('a+b=c');
    });

    it('una cookie vacía cuenta como ausente', () => {
      // Es lo que deja un `clearCookie` en algunos navegadores; tratarla como
      // presente mandaría la cadena vacía al dominio y el error sería confuso.
      expect(readRefreshCookie(requestStub(`${REFRESH_COOKIE_NAME}=`))).toBe(
        undefined,
      );
    });

    it('sin cabecera Cookie no hay token', () => {
      expect(readRefreshCookie(requestStub())).toBeUndefined();
    });

    it('tolera una cabecera con trozos mal formados', () => {
      const req = requestStub(`basura; ${REFRESH_COOKIE_NAME}=bueno`);

      expect(readRefreshCookie(req)).toBe('bueno');
    });
  });
});
