import {
  assertPharmacyErpNotInProduction,
  loadPharmacyErpEnv,
  pharmacyErpEnvSchema,
} from './pharmacy-erp.env';

const SIMULATOR = 'http://mock-provider:4100';

describe('assertPharmacyErpNotInProduction', () => {
  it('aborta en producción cuando la URL del sistema externo trae valor', () => {
    expect(() =>
      assertPharmacyErpNotInProduction({
        NODE_ENV: 'production',
        PHARMACY_ERP_BASE_URL: SIMULATOR,
      }),
    ).toThrow(/PHARMACY_ERP_BASE_URL está configurada en producción/);
  });

  it('el mensaje dice el riesgo: stock inventado en el libro real', () => {
    expect(() =>
      assertPharmacyErpNotInProduction({
        NODE_ENV: 'production',
        PHARMACY_ERP_BASE_URL: SIMULATOR,
      }),
    ).toThrow(/libro de inventario/);
  });

  it.each([[''], ['   '], [undefined]])(
    'deja arrancar en producción con la URL vacía (%p)',
    (value) => {
      expect(() =>
        assertPharmacyErpNotInProduction({
          NODE_ENV: 'production',
          PHARMACY_ERP_BASE_URL: value,
        }),
      ).not.toThrow();
    },
  );

  it.each([['development'], ['test'], [undefined]])(
    'fuera de producción (%p) la URL se acepta',
    (env) => {
      expect(() =>
        assertPharmacyErpNotInProduction({
          NODE_ENV: env,
          PHARMACY_ERP_BASE_URL: SIMULATOR,
        }),
      ).not.toThrow();
    },
  );
});

describe('loadPharmacyErpEnv', () => {
  it('en producción con URL no devuelve configuración: el adaptador no se construye', () => {
    expect(() =>
      loadPharmacyErpEnv({
        NODE_ENV: 'production',
        PHARMACY_ERP_BASE_URL: SIMULATOR,
      }),
    ).toThrow(/PHARMACY_ERP_BASE_URL/);
  });

  it('fuera de producción lee la URL sin barra final, la clave y el plazo', () => {
    expect(
      loadPharmacyErpEnv({
        NODE_ENV: 'development',
        PHARMACY_ERP_BASE_URL: ' http://mock-provider:4100// ',
        PHARMACY_ERP_API_KEY: 'k',
        PHARMACY_ERP_TIMEOUT_MS: '2500',
      }),
    ).toEqual({ baseUrl: SIMULATOR, apiKey: 'k', timeoutMs: 2500 });
  });
});

describe('pharmacyErpEnvSchema', () => {
  it('rechaza la URL con NODE_ENV=production', () => {
    const { error } = pharmacyErpEnvSchema.validate({
      NODE_ENV: 'production',
      PHARMACY_ERP_BASE_URL: SIMULATOR,
    });
    expect(error?.message).toMatch(/PHARMACY_ERP_BASE_URL/);
  });

  it('acepta la URL vacía en producción y la URL fuera de producción', () => {
    expect(
      pharmacyErpEnvSchema.validate({
        NODE_ENV: 'production',
        PHARMACY_ERP_BASE_URL: '',
      }).error,
    ).toBeUndefined();
    expect(
      pharmacyErpEnvSchema.validate({
        NODE_ENV: 'development',
        PHARMACY_ERP_BASE_URL: SIMULATOR,
      }).error,
    ).toBeUndefined();
  });
});
