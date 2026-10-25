import { SEED } from '../common/constants/concepts';
import {
  assertMockProviderNotInProduction,
  loadWorkerEnv,
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

/**
 * El mantenimiento físico de `time_series` actúa sobre tablas compartidas por
 * todos los tenants: su atribución es una decisión del despliegue, no una
 * constante escondida en cada job.
 */
describe('TS_ADMIN_TENANT_ID', () => {
  const original = process.env.TS_ADMIN_TENANT_ID;
  afterEach(() => {
    if (original === undefined) delete process.env.TS_ADMIN_TENANT_ID;
    else process.env.TS_ADMIN_TENANT_ID = original;
  });

  it('sin valor, el sujeto de plataforma es el tenant DEFAULT del seed', () => {
    delete process.env.TS_ADMIN_TENANT_ID;
    expect(loadWorkerEnv().tsAdminTenantId).toBe(SEED.tenantId);
  });

  it('toma el tenant de plataforma declarado por el despliegue', () => {
    process.env.TS_ADMIN_TENANT_ID = '  7B1E5C0A-6C1B-4E0E-9B7B-0A6F4D2E9C11 ';
    expect(loadWorkerEnv().tsAdminTenantId).toBe(
      '7b1e5c0a-6c1b-4e0e-9b7b-0a6f4d2e9c11',
    );
  });

  it('un valor que no es UUID aborta en vez de caer a otro tenant', () => {
    process.env.TS_ADMIN_TENANT_ID = 'acme';
    expect(() => loadWorkerEnv()).toThrow(/TS_ADMIN_TENANT_ID/);
    expect(
      workerEnvSchema.validate({ TS_ADMIN_TENANT_ID: 'acme' }).error,
    ).toBeDefined();
  });
});
