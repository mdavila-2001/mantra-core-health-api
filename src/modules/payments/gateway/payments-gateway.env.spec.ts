import {
  loadPaymentsGatewayConfig,
  paymentsGatewayEnvSchema,
} from './payments-gateway.env';
import {
  TEST_API_KEY,
  TEST_WEBHOOK_SECRET,
} from './payments-gateway.double.testing';

const NOT_A_SECRET_KEY = ['pk', 'test', 'noEsUnaClaveSecreta12345'].join('_');

const COMPLETE = {
  PAYMENTS_VIA_GATEWAY: 'true',
  PAYMENTS_GATEWAY_BASE_URL: 'https://sandbox.pay.example/v1/',
  PAYMENTS_GATEWAY_API_KEY: TEST_API_KEY,
  PAYMENTS_GATEWAY_WEBHOOK_SECRETS: TEST_WEBHOOK_SECRET,
} satisfies NodeJS.ProcessEnv;

describe('loadPaymentsGatewayConfig', () => {
  describe('correcto', () => {
    it('queda APAGADO por defecto y no exige nada', () => {
      const config = loadPaymentsGatewayConfig({});
      expect(config.viaGateway).toBe(false);
      expect(config.mode).toBeNull();
      expect(config.apiKey).toBe('');
      expect(config.baseUrl).toBe('');
    });

    it('con el flag encendido y todo completo, normaliza la URL y deriva el modo de la clave', () => {
      const config = loadPaymentsGatewayConfig(COMPLETE);
      expect(config.viaGateway).toBe(true);
      expect(config.baseUrl).toBe('https://sandbox.pay.example/v1');
      expect(config.mode).toBe('test');
      expect(config.webhookSecrets).toEqual([TEST_WEBHOOK_SECRET]);
      expect(config.webhookToleranceSeconds).toBe(300);
      expect(config.maxAttempts).toBe(3);
    });

    it('acepta dos secretos separados por coma (rotación sin corte)', () => {
      const config = loadPaymentsGatewayConfig({
        ...COMPLETE,
        PAYMENTS_GATEWAY_WEBHOOK_SECRETS: `${TEST_WEBHOOK_SECRET}, ${TEST_WEBHOOK_SECRET}`,
      });
      expect(config.webhookSecrets).toHaveLength(2);
    });

    it('ignora el resto de la configuración mientras el flag esté apagado', () => {
      const config = loadPaymentsGatewayConfig({
        PAYMENTS_VIA_GATEWAY: 'false',
        PAYMENTS_GATEWAY_API_KEY: 'basura',
      });
      expect(config.viaGateway).toBe(false);
      expect(config.apiKey).toBe('');
    });
  });

  describe('límite', () => {
    it.each([['true'], ['TRUE'], [' true ']])(
      'interpreta %j como encendido',
      (value) => {
        expect(
          loadPaymentsGatewayConfig({
            ...COMPLETE,
            PAYMENTS_VIA_GATEWAY: value,
          }).viaGateway,
        ).toBe(true);
      },
    );

    it.each([[''], ['0'], ['yes'], ['false']])(
      'interpreta %j como apagado (sólo "true" enciende)',
      (value) => {
        expect(
          loadPaymentsGatewayConfig({
            ...COMPLETE,
            PAYMENTS_VIA_GATEWAY: value,
          }).viaGateway,
        ).toBe(false);
      },
    );

    it('una clave sk_live_ se reconoce como modo live', () => {
      expect(
        loadPaymentsGatewayConfig({
          ...COMPLETE,
          // Armada en ejecución: un literal `sk_live_…` dispara la protección de secretos del remoto aunque sea sintético.
          PAYMENTS_GATEWAY_API_KEY: [
            'sk',
            'live',
            'unaClaveSinteticaDeCuarentaChars',
          ].join('_'),
        }).mode,
      ).toBe('live');
    });
  });

  describe('inválido: con el flag encendido falla al arrancar y nombra la variable, nunca su valor', () => {
    it.each([
      ['PAYMENTS_GATEWAY_BASE_URL', ''],
      ['PAYMENTS_GATEWAY_API_KEY', ''],
      ['PAYMENTS_GATEWAY_API_KEY', NOT_A_SECRET_KEY],
      ['PAYMENTS_GATEWAY_WEBHOOK_SECRETS', ''],
      ['PAYMENTS_GATEWAY_WEBHOOK_SECRETS', 'whsec_corto'],
    ])('%s = %j', (name, value) => {
      const env = { ...COMPLETE, [name]: value };
      expect(() => loadPaymentsGatewayConfig(env)).toThrow(name);
      try {
        loadPaymentsGatewayConfig(env);
      } catch (error) {
        if (value) {
          expect((error as Error).message).not.toContain(value);
        }
      }
    });

    it('una clave pública whpk_ mal formada se rechaza', () => {
      expect(() =>
        loadPaymentsGatewayConfig({
          ...COMPLETE,
          PAYMENTS_GATEWAY_WEBHOOK_PUBLIC_KEYS: 'whpk_corta',
        }),
      ).toThrow('PAYMENTS_GATEWAY_WEBHOOK_PUBLIC_KEYS');
    });
  });
});

describe('paymentsGatewayEnvSchema (validación global de AppModule)', () => {
  const validate = (env: Record<string, unknown>) =>
    paymentsGatewayEnvSchema.validate(env, { abortEarly: false });

  it('un entorno sin ninguna variable es válido y el flag queda apagado', () => {
    const { error, value } = validate({});
    expect(error).toBeUndefined();
    expect(value.PAYMENTS_VIA_GATEWAY).toBe(false);
  });

  it('con el flag encendido exige URL y clave', () => {
    const { error } = validate({ PAYMENTS_VIA_GATEWAY: 'true' });
    const missing = error?.details.map((d) => d.path.join('.')) ?? [];
    expect(missing).toEqual(
      expect.arrayContaining([
        'PAYMENTS_GATEWAY_BASE_URL',
        'PAYMENTS_GATEWAY_API_KEY',
      ]),
    );
  });

  it('con el flag encendido y los datos completos es válido', () => {
    expect(validate(COMPLETE).error).toBeUndefined();
  });

  it('rechaza una clave que no es sk_test_/sk_live_', () => {
    const { error } = validate({
      ...COMPLETE,
      PAYMENTS_GATEWAY_API_KEY: NOT_A_SECRET_KEY,
    });
    expect(error).toBeDefined();
  });
});
