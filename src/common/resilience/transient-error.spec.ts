import {
  httpStatusOf,
  isTransientError,
  networkCodeOf,
  retryAfterFromError,
} from './transient-error';

describe('isTransientError', () => {
  it.each([
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'ECONNABORTED',
  ])('trata %s como transitorio', (code) => {
    expect(isTransientError(Object.assign(new Error('red'), { code }))).toBe(
      true,
    );
  });

  it.each([500, 502, 503, 504, 408, 429])(
    'trata el estado %s como transitorio',
    (status) => {
      expect(isTransientError({ response: { status } })).toBe(true);
    },
  );

  it.each([400, 401, 403, 404, 409, 422, 501])(
    'trata el estado %s como permanente: reintentarlo sólo suma carga',
    (status) => {
      expect(isTransientError({ response: { status } })).toBe(false);
    },
  );

  it('un error del propio código no es transitorio', () => {
    expect(isTransientError(new TypeError('x is not a function'))).toBe(false);
  });

  it('un código desconocido se considera permanente (allowlist cerrada)', () => {
    expect(
      isTransientError(Object.assign(new Error('?'), { code: 'EWHATEVER' })),
    ).toBe(false);
  });

  it('no confunde el status del error con el de la respuesta', () => {
    // Un `HttpException` de Nest lleva el status en `status`, no en `response`.
    expect(isTransientError({ status: 503 })).toBe(true);
    expect(isTransientError({ statusCode: 409 })).toBe(false);
  });
});

describe('httpStatusOf / networkCodeOf', () => {
  it('prefiere el status de la respuesta sobre el del error', () => {
    expect(httpStatusOf({ status: 500, response: { status: 429 } })).toBe(429);
  });

  it('descarta valores fuera del rango HTTP', () => {
    expect(httpStatusOf({ status: 7 })).toBeUndefined();
  });

  it('devuelve undefined para entradas que no son objeto', () => {
    expect(httpStatusOf('boom')).toBeUndefined();
    expect(networkCodeOf(null)).toBeUndefined();
  });
});

describe('retryAfterFromError', () => {
  it('interpreta Retry-After en segundos', () => {
    expect(
      retryAfterFromError({ response: { headers: { 'retry-after': '2' } } }),
    ).toBe(2000);
  });

  it('interpreta Retry-After como fecha HTTP relativa al ahora', () => {
    const now = Date.parse('2026-01-01T00:00:00Z');
    const value = retryAfterFromError(
      {
        response: {
          headers: { 'retry-after': 'Thu, 01 Jan 2026 00:00:05 GMT' },
        },
      },
      () => now,
    );
    expect(value).toBe(5000);
  });

  it('nunca devuelve una espera negativa para una fecha ya pasada', () => {
    const now = Date.parse('2026-01-01T00:01:00Z');
    expect(
      retryAfterFromError(
        {
          response: {
            headers: { 'retry-after': 'Thu, 01 Jan 2026 00:00:00 GMT' },
          },
        },
        () => now,
      ),
    ).toBe(0);
  });

  it('devuelve undefined cuando la cabecera no es interpretable', () => {
    expect(
      retryAfterFromError({
        response: { headers: { 'retry-after': 'luego' } },
      }),
    ).toBeUndefined();
    expect(retryAfterFromError({ response: {} })).toBeUndefined();
  });
});
