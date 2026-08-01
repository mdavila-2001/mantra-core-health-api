import {
  assertMockProviderNotInProduction,
  workerEnvSchema,
} from './worker.env';

/**
 * Guardarraíl del emulador de proveedores.
 *
 * `mock-provider-server` acepta por defecto toda verificación de identidad y de
 * matrícula profesional (tasa de rechazo 0). Que eso llegue a producción sería
 * dar por verificado a cualquiera, así que el arranque debe abortar. Estas
 * pruebas son la red que impide que ese guardarraíl se caiga sin que nadie lo note.
 */
describe('assertMockProviderNotInProduction', () => {
  it('aborta en producción cuando el emulador está configurado', () => {
    expect(() =>
      assertMockProviderNotInProduction({
        NODE_ENV: 'production',
        MOCK_PROVIDER_BASE_URL: 'http://mock-provider-server:4100',
      }),
    ).toThrow(/MOCK_PROVIDER_BASE_URL está configurada en producción/);
  });

  it('el mensaje explica el riesgo concreto, no solo que está mal configurado', () => {
    expect(() =>
      assertMockProviderNotInProduction({
        NODE_ENV: 'production',
        MOCK_PROVIDER_BASE_URL: 'http://mock:4100',
      }),
    ).toThrow(/verificación de identidad y de matrícula profesional/);
  });

  it('deja arrancar en producción con la variable vacía', () => {
    expect(() =>
      assertMockProviderNotInProduction({
        NODE_ENV: 'production',
        MOCK_PROVIDER_BASE_URL: '',
      }),
    ).not.toThrow();
  });

  it('trata los espacios en blanco como ausencia de valor', () => {
    expect(() =>
      assertMockProviderNotInProduction({
        NODE_ENV: 'production',
        MOCK_PROVIDER_BASE_URL: '   ',
      }),
    ).not.toThrow();
  });

  it('deja arrancar en producción si la variable no está declarada', () => {
    expect(() =>
      assertMockProviderNotInProduction({ NODE_ENV: 'production' }),
    ).not.toThrow();
  });

  it('no interfiere fuera de producción, que es donde el emulador se usa', () => {
    for (const env of ['development', 'test', 'staging', undefined]) {
      expect(() =>
        assertMockProviderNotInProduction({
          ...(env ? { NODE_ENV: env } : {}),
          MOCK_PROVIDER_BASE_URL: 'http://127.0.0.1:4100',
        }),
      ).not.toThrow();
    }
  });
});

describe('workerEnvSchema · default de MOCK_PROVIDER_BASE_URL', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  it('apunta al emulador local fuera de producción', () => {
    process.env.NODE_ENV = 'development';
    const { value } = workerEnvSchema.validate({}, { allowUnknown: true }) as {
      value: Record<string, unknown>;
    };

    expect(value.MOCK_PROVIDER_BASE_URL).toBe('http://127.0.0.1:4100');
  });

  it('queda VACÍO en producción', () => {
    // Es la mitad silenciosa del guardarraíl: `ConfigModule` escribe los
    // defaults de Joi de vuelta en `process.env`, así que un default fijo aquí
    // haría que la comprobación de producción nunca viera la variable vacía y
    // el proceso abortara en todo despliegue productivo.
    process.env.NODE_ENV = 'production';
    const { value } = workerEnvSchema.validate({}, { allowUnknown: true }) as {
      value: Record<string, unknown>;
    };

    expect(value.MOCK_PROVIDER_BASE_URL).toBe('');
  });
});
