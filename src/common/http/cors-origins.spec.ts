import { buildCorsOptions, loadCorsAllowedOrigins } from './cors-origins';

describe('loadCorsAllowedOrigins', () => {
  it('sin variable devuelve lista vacía (CORS denegado)', () => {
    expect(loadCorsAllowedOrigins({})).toEqual([]);
    expect(loadCorsAllowedOrigins({ CORS_ALLOWED_ORIGINS: '  ' })).toEqual([]);
  });

  it('parte por comas, recorta espacios y acepta barra final', () => {
    expect(
      loadCorsAllowedOrigins({
        CORS_ALLOWED_ORIGINS:
          'https://app.alovida.com/ , https://www.alovida.com,,http://localhost:4200',
      }),
    ).toEqual([
      'https://app.alovida.com',
      'https://www.alovida.com',
      'http://localhost:4200',
    ]);
  });

  it('rechaza el comodín', () => {
    expect(() => loadCorsAllowedOrigins({ CORS_ALLOWED_ORIGINS: '*' })).toThrow(
      /no admite/,
    );
  });

  it('rechaza valores que no son un origen', () => {
    expect(() =>
      loadCorsAllowedOrigins({ CORS_ALLOWED_ORIGINS: 'app.alovida.com' }),
    ).toThrow();
    expect(() =>
      loadCorsAllowedOrigins({
        CORS_ALLOWED_ORIGINS: 'https://app.alovida.com/login',
      }),
    ).toThrow(/sin ruta/);
    expect(() =>
      loadCorsAllowedOrigins({ CORS_ALLOWED_ORIGINS: 'ftp://alovida.com' }),
    ).toThrow(/https/);
  });
});

describe('buildCorsOptions', () => {
  it('lista vacía deniega', () => {
    expect(buildCorsOptions([])).toEqual({ origin: false });
  });

  it('con orígenes habilita credenciales', () => {
    expect(buildCorsOptions(['https://app.alovida.com'])).toEqual({
      origin: ['https://app.alovida.com'],
      credentials: true,
    });
  });
});
