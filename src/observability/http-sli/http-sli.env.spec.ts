import { describe, it, expect } from '@jest/globals';
import { HTTP_SLI_DEFAULT_FLUSH_SECONDS, loadHttpSliEnv } from './http-sli.env';

describe('loadHttpSliEnv', () => {
  it('sin variables queda apagada y con el volcado por defecto', () => {
    expect(loadHttpSliEnv({})).toEqual({
      enabled: false,
      flushSeconds: HTTP_SLI_DEFAULT_FLUSH_SECONDS,
    });
  });

  it('las variables vacías cuentan como ausentes', () => {
    expect(
      loadHttpSliEnv({
        OBSERVABILITY_HTTP_SLI_ENABLED: '',
        OBSERVABILITY_HTTP_SLI_FLUSH_SECONDS: '  ',
      }),
    ).toEqual({ enabled: false, flushSeconds: 60 });
  });

  it('sólo el literal "true" enciende', () => {
    expect(
      loadHttpSliEnv({ OBSERVABILITY_HTTP_SLI_ENABLED: 'true' }).enabled,
    ).toBe(true);
    expect(
      loadHttpSliEnv({ OBSERVABILITY_HTTP_SLI_ENABLED: 'false' }).enabled,
    ).toBe(false);
  });

  it.each(['1', 'yes', 'TRUE', 'on'])(
    'un valor ambiguo (%s) falla al arrancar en vez de apagarse en silencio',
    (value) => {
      expect(() =>
        loadHttpSliEnv({ OBSERVABILITY_HTTP_SLI_ENABLED: value }),
      ).toThrow(/OBSERVABILITY_HTTP_SLI_ENABLED/);
    },
  );

  it('acepta los bordes del volcado: 10 y 3600', () => {
    expect(
      loadHttpSliEnv({ OBSERVABILITY_HTTP_SLI_FLUSH_SECONDS: '10' })
        .flushSeconds,
    ).toBe(10);
    expect(
      loadHttpSliEnv({ OBSERVABILITY_HTTP_SLI_FLUSH_SECONDS: '3600' })
        .flushSeconds,
    ).toBe(3600);
  });

  it.each(['9', '3601', '0', '-60', '60.5', 'abc'])(
    'rechaza un volcado fuera de rango o no entero (%s)',
    (value) => {
      expect(() =>
        loadHttpSliEnv({ OBSERVABILITY_HTTP_SLI_FLUSH_SECONDS: value }),
      ).toThrow(/OBSERVABILITY_HTTP_SLI_FLUSH_SECONDS/);
    },
  );
});
